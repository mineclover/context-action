#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

/**
 * 작업 대상 순차 반환 CLI
 * Usage: node work-queue-cli.cjs [command] [options]
 * 
 * Commands:
 *   list [language]     - 모든 작업 대상 나열
 *   next [language]     - 다음 작업 대상 반환
 *   status [language]   - 작업 상태 요약
 *   reset [language]    - 작업 큐 초기화
 *   complete <id>       - 작업 완료 처리
 *   skip <id>           - 작업 건너뛰기
 */

class WorkQueueManager {
  constructor() {
    this.dataDir = path.resolve(__dirname, 'data');
    this.stateFile = path.resolve(__dirname, 'work-queue-state.json');
  }

  async initialize() {
    try {
      await fs.access(this.stateFile);
    } catch {
      // 상태 파일이 없으면 초기화
      await this.resetState();
    }
  }

  async loadState() {
    try {
      const stateContent = await fs.readFile(this.stateFile, 'utf-8');
      return JSON.parse(stateContent);
    } catch {
      return this.getDefaultState();
    }
  }

  async saveState(state) {
    await fs.writeFile(this.stateFile, JSON.stringify(state, null, 2), 'utf-8');
  }

  getDefaultState() {
    return {
      currentIndex: {},  // language -> currentIndex
      completed: {},     // language -> Set of completed IDs
      skipped: {},       // language -> Set of skipped IDs
      lastUpdated: new Date().toISOString()
    };
  }

  async resetState(language = null) {
    const state = await this.loadState();
    
    if (language) {
      state.currentIndex[language] = 0;
      state.completed[language] = [];
      state.skipped[language] = [];
    } else {
      Object.assign(state, this.getDefaultState());
    }
    
    state.lastUpdated = new Date().toISOString();
    await this.saveState(state);
    
    console.log(`🔄 Work queue ${language ? `for ${language}` : ''} has been reset`);
  }

  async scanWorkTargets(language = 'en') {
    const langDir = path.join(this.dataDir, language);
    const targets = [];

    try {
      const entries = await fs.readdir(langDir);
      
      for (const entry of entries) {
        const entryPath = path.join(langDir, entry);
        const stats = await fs.stat(entryPath);
        
        if (stats.isDirectory()) {
          const priorityFile = path.join(entryPath, 'priority.json');
          
          try {
            await fs.access(priorityFile);
            const priorityContent = await fs.readFile(priorityFile, 'utf-8');
            const priority = JSON.parse(priorityContent);
            
            // 작업 필요성 평가
            const workNeeded = this.assessWorkNeeded(priority);
            
            targets.push({
              id: entry,
              title: priority.document.title,
              category: priority.document.category,
              sourcePath: priority.document.source_path,
              priority: priority.priority.score,
              tier: priority.priority.tier,
              workNeeded,
              priorityFile,
              dataDir: entryPath
            });
          } catch (error) {
            console.warn(`⚠️  Skipping ${entry}: ${error.message}`);
          }
        }
      }
    } catch (error) {
      throw new Error(`Failed to scan language directory ${language}: ${error.message}`);
    }

    // 작업 우선순위로 정렬
    return this.sortByWorkPriority(targets);
  }

  assessWorkNeeded(priority) {
    const issues = [];
    let workScore = 0;

    // 필수 필드 검사
    if (!priority.priority.score) {
      issues.push('Missing priority score');
      workScore += 10;
    }
    
    if (!priority.priority.tier) {
      issues.push('Missing priority tier');
      workScore += 8;
    }
    
    if (!priority.purpose.primary_goal) {
      issues.push('Missing primary goal');
      workScore += 6;
    }
    
    if (!priority.tags.complexity) {
      issues.push('Missing complexity tag');
      workScore += 4;
    }
    
    if (priority.keywords.primary.length === 0) {
      issues.push('No primary keywords');
      workScore += 5;
    }
    
    if (priority.dependencies.prerequisites.length === 0 && priority.dependencies.references.length === 0) {
      issues.push('No dependencies defined');
      workScore += 3;
    }
    
    if (!priority.extraction.strategy) {
      issues.push('Missing extraction strategy');
      workScore += 7;
    }

    return {
      issues,
      workScore,
      needsWork: workScore > 0
    };
  }

  sortByWorkPriority(targets) {
    return targets.sort((a, b) => {
      // 1. 작업 필요성 (높은 점수 먼저)
      if (a.workNeeded.workScore !== b.workNeeded.workScore) {
        return b.workNeeded.workScore - a.workNeeded.workScore;
      }
      
      // 2. 우선순위 점수 (높은 점수 먼저)
      const aPriority = a.priority || 0;
      const bPriority = b.priority || 0;
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      // 3. 카테고리별 우선순위
      const categoryOrder = { 'guide': 1, 'concept': 2, 'api': 3, 'examples': 4 };
      const aCatOrder = categoryOrder[a.category] || 5;
      const bCatOrder = categoryOrder[b.category] || 5;
      if (aCatOrder !== bCatOrder) {
        return aCatOrder - bCatOrder;
      }
      
      // 4. 알파벳 순
      return a.id.localeCompare(b.id);
    });
  }

  async listTargets(language = 'en', showAll = false) {
    const targets = await this.scanWorkTargets(language);
    const state = await this.loadState();
    const completed = new Set(state.completed[language] || []);
    const skipped = new Set(state.skipped[language] || []);

    console.log(`📋 Work targets for ${language.toUpperCase()}:\n`);

    let index = 0;
    for (const target of targets) {
      const status = completed.has(target.id) ? '✅' : 
                    skipped.has(target.id) ? '⏭️' : 
                    index === (state.currentIndex[language] || 0) ? '👉' : '⏳';
      
      if (showAll || (!completed.has(target.id) && !skipped.has(target.id))) {
        console.log(`${status} [${index.toString().padStart(3)}] ${target.id}`);
        console.log(`    📖 ${target.title}`);
        console.log(`    📁 ${target.category} | Priority: ${target.priority || 'null'} | Tier: ${target.tier || 'empty'}`);
        
        if (target.workNeeded.needsWork) {
          console.log(`    🔧 Work Score: ${target.workNeeded.workScore} - ${target.workNeeded.issues.join(', ')}`);
        }
        
        console.log('');
      }
      
      if (!completed.has(target.id) && !skipped.has(target.id)) {
        index++;
      }
    }

    const totalTargets = targets.length;
    const completedCount = completed.size;
    const skippedCount = skipped.size;
    const remainingCount = totalTargets - completedCount - skippedCount;

    console.log(`📊 Summary: ${totalTargets} total, ${completedCount} completed, ${skippedCount} skipped, ${remainingCount} remaining`);
  }

  async getNext(language = 'en') {
    const targets = await this.scanWorkTargets(language);
    const state = await this.loadState();
    const completed = new Set(state.completed[language] || []);
    const skipped = new Set(state.skipped[language] || []);
    
    // 완료되지 않은 대상들 필터링
    const remainingTargets = targets.filter(target => 
      !completed.has(target.id) && !skipped.has(target.id)
    );

    if (remainingTargets.length === 0) {
      console.log('🎉 All work completed!');
      return null;
    }

    const currentIndex = state.currentIndex[language] || 0;
    const nextTarget = remainingTargets[0]; // 항상 첫 번째 미완료 작업

    console.log('👉 Next work target:\n');
    console.log(`📌 ID: ${nextTarget.id}`);
    console.log(`📖 Title: ${nextTarget.title}`);
    console.log(`📁 Category: ${nextTarget.category}`);
    console.log(`📄 Source: ${nextTarget.sourcePath}`);
    console.log(`⭐ Priority: ${nextTarget.priority || 'null'} | Tier: ${nextTarget.tier || 'empty'}`);
    console.log(`📂 Data Directory: ${nextTarget.dataDir}`);
    console.log(`📝 Priority File: ${nextTarget.priorityFile}`);
    
    if (nextTarget.workNeeded.needsWork) {
      console.log(`\n🔧 Work needed (Score: ${nextTarget.workNeeded.workScore}):`);
      nextTarget.workNeeded.issues.forEach(issue => {
        console.log(`   • ${issue}`);
      });
    }

    console.log(`\n📊 Progress: ${completed.size + skipped.size + 1}/${targets.length}`);
    
    return nextTarget;
  }

  async completeWork(targetId, language = 'en') {
    const state = await this.loadState();
    
    if (!state.completed[language]) {
      state.completed[language] = [];
    }
    
    if (!state.completed[language].includes(targetId)) {
      state.completed[language].push(targetId);
      state.lastUpdated = new Date().toISOString();
      await this.saveState(state);
      
      console.log(`✅ Marked ${targetId} as completed`);
    } else {
      console.log(`ℹ️  ${targetId} was already marked as completed`);
    }
  }

  async skipWork(targetId, language = 'en') {
    const state = await this.loadState();
    
    if (!state.skipped[language]) {
      state.skipped[language] = [];
    }
    
    if (!state.skipped[language].includes(targetId)) {
      state.skipped[language].push(targetId);
      state.lastUpdated = new Date().toISOString();
      await this.saveState(state);
      
      console.log(`⏭️  Marked ${targetId} as skipped`);
    } else {
      console.log(`ℹ️  ${targetId} was already marked as skipped`);
    }
  }

  async showStatus(language = 'en') {
    const targets = await this.scanWorkTargets(language);
    const state = await this.loadState();
    const completed = new Set(state.completed[language] || []);
    const skipped = new Set(state.skipped[language] || []);

    const totalTargets = targets.length;
    const completedCount = completed.size;
    const skippedCount = skipped.size;
    const remainingCount = totalTargets - completedCount - skippedCount;

    // 작업 필요도별 통계
    const workNeededCount = targets.filter(t => t.workNeeded.needsWork && !completed.has(t.id) && !skipped.has(t.id)).length;
    const avgWorkScore = targets
      .filter(t => !completed.has(t.id) && !skipped.has(t.id))
      .reduce((sum, t) => sum + t.workNeeded.workScore, 0) / Math.max(remainingCount, 1);

    console.log(`📊 Work Queue Status (${language.toUpperCase()})`);
    console.log(`Last Updated: ${state.lastUpdated}`);
    console.log('');
    console.log(`📈 Progress:`);
    console.log(`   Total Targets: ${totalTargets}`);
    console.log(`   ✅ Completed: ${completedCount} (${(completedCount/totalTargets*100).toFixed(1)}%)`);
    console.log(`   ⏭️  Skipped: ${skippedCount} (${(skippedCount/totalTargets*100).toFixed(1)}%)`);
    console.log(`   ⏳ Remaining: ${remainingCount} (${(remainingCount/totalTargets*100).toFixed(1)}%)`);
    console.log('');
    console.log(`🔧 Work Analysis:`);
    console.log(`   Targets needing work: ${workNeededCount}/${remainingCount}`);
    console.log(`   Average work score: ${avgWorkScore.toFixed(1)}`);

    // 카테고리별 통계
    const categoryStats = {};
    targets.forEach(target => {
      if (!categoryStats[target.category]) {
        categoryStats[target.category] = { total: 0, completed: 0, remaining: 0 };
      }
      categoryStats[target.category].total++;
      if (completed.has(target.id)) {
        categoryStats[target.category].completed++;
      } else if (!skipped.has(target.id)) {
        categoryStats[target.category].remaining++;
      }
    });

    console.log('');
    console.log(`📁 By Category:`);
    Object.entries(categoryStats).forEach(([category, stats]) => {
      const progress = stats.total > 0 ? (stats.completed / stats.total * 100).toFixed(1) : '0.0';
      console.log(`   ${category}: ${stats.completed}/${stats.total} (${progress}%) - ${stats.remaining} remaining`);
    });
  }

  async checkDuplicates(language = null) {
    console.log('🔍 Checking for duplicate IDs...\n');
    
    const languages = language ? [language] : ['en', 'ko'];
    const allDuplicates = {
      sameLanguage: {},
      crossLanguage: {},
      filesystem: []
    };

    // 모든 문서 수집
    const allDocuments = [];
    for (const lang of languages) {
      try {
        const targets = await this.scanWorkTargets(lang);
        allDocuments.push(...targets.map(target => ({
          ...target,
          language: lang
        })));
      } catch (error) {
        console.warn(`⚠️  Failed to scan ${lang}: ${error.message}`);
      }
    }

    // 1. 동일 언어 내 중복 검사
    for (const lang of languages) {
      const langDocs = allDocuments.filter(doc => doc.language === lang);
      const idCounts = {};
      
      langDocs.forEach(doc => {
        idCounts[doc.id] = (idCounts[doc.id] || []);
        idCounts[doc.id].push(doc);
      });

      const duplicates = Object.entries(idCounts).filter(([id, docs]) => docs.length > 1);
      if (duplicates.length > 0) {
        allDuplicates.sameLanguage[lang] = duplicates;
      }
    }

    // 2. 파일시스템 충돌 검사 (대소문자 구분 없는 시스템 대응)
    const fsIdCounts = {};
    allDocuments.forEach(doc => {
      const fsKey = `${doc.language}:${doc.id.toLowerCase()}`;
      fsIdCounts[fsKey] = (fsIdCounts[fsKey] || []);
      fsIdCounts[fsKey].push(doc);
    });

    const fsConflicts = Object.entries(fsIdCounts).filter(([key, docs]) => {
      return docs.length > 1 && new Set(docs.map(d => d.id)).size > 1;
    });

    if (fsConflicts.length > 0) {
      allDuplicates.filesystem = fsConflicts;
    }

    // 3. 언어간 동일 ID (정보성, 문제 아님)
    const crossLangIds = {};
    allDocuments.forEach(doc => {
      crossLangIds[doc.id] = (crossLangIds[doc.id] || []);
      crossLangIds[doc.id].push(doc.language);
    });

    const crossLangDups = Object.entries(crossLangIds).filter(([id, langs]) => 
      new Set(langs).size > 1
    );

    if (crossLangDups.length > 0) {
      allDuplicates.crossLanguage = crossLangDups;
    }

    // 결과 출력
    this.reportDuplicates(allDuplicates, allDocuments.length);
    return allDuplicates;
  }

  reportDuplicates(duplicates, totalDocs) {
    let hasIssues = false;

    // 동일 언어 내 중복 (문제 상황)
    if (Object.keys(duplicates.sameLanguage).length > 0) {
      hasIssues = true;
      console.log('🚨 Same Language Duplicates (REQUIRES RESOLUTION):');
      Object.entries(duplicates.sameLanguage).forEach(([lang, dups]) => {
        console.log(`\n   Language: ${lang.toUpperCase()}`);
        dups.forEach(([id, docs]) => {
          console.log(`   ⚠️  ID: "${id}" (${docs.length} files)`);
          docs.forEach(doc => {
            console.log(`      📄 ${doc.sourcePath}`);
          });
        });
      });
    }

    // 파일시스템 충돌 (문제 상황)
    if (duplicates.filesystem.length > 0) {
      hasIssues = true;
      console.log('\n🚨 Filesystem Conflicts (REQUIRES RESOLUTION):');
      duplicates.filesystem.forEach(([key, docs]) => {
        console.log(`   ⚠️  Conflict Key: "${key}"`);
        docs.forEach(doc => {
          console.log(`      📄 ${doc.language}/${doc.id} → ${doc.sourcePath}`);
        });
      });
    }

    // 언어간 중복 (정상 상황)
    if (duplicates.crossLanguage.length > 0) {
      console.log('\n✅ Cross-Language Duplicates (NORMAL):');
      const sampleCount = Math.min(5, duplicates.crossLanguage.length);
      duplicates.crossLanguage.slice(0, sampleCount).forEach(([id, langs]) => {
        console.log(`   📋 "${id}" → [${langs.join(', ')}]`);
      });
      
      if (duplicates.crossLanguage.length > sampleCount) {
        console.log(`   ... and ${duplicates.crossLanguage.length - sampleCount} more`);
      }
    }

    // 요약
    console.log('\n📊 Duplicate Check Summary:');
    console.log(`   Total Documents: ${totalDocs}`);
    console.log(`   Same Language Conflicts: ${Object.values(duplicates.sameLanguage).flat().length}`);
    console.log(`   Filesystem Conflicts: ${duplicates.filesystem.length}`);
    console.log(`   Cross Language (Normal): ${duplicates.crossLanguage.length}`);

    if (!hasIssues) {
      console.log('\n🎉 No duplicate conflicts found!');
    } else {
      console.log('\n⚠️  Conflicts detected. Use "resolve-duplicates" command to fix.');
    }
  }

  async resolveDuplicates(language = null, options = {}) {
    const dryRun = options.dryRun || false;
    const strategy = options.strategy || 'auto';
    
    console.log(`🔧 ${dryRun ? 'Analyzing' : 'Resolving'} duplicate conflicts...`);
    if (dryRun) {
      console.log('   (Dry run mode - no changes will be made)');
    }
    console.log('');

    // 중복 검사 실행
    const duplicates = await this.checkDuplicates(language);
    
    // 해결이 필요한 중복만 처리
    const resolutionNeeded = [];
    
    // 동일 언어 내 중복 추가
    Object.entries(duplicates.sameLanguage).forEach(([lang, dups]) => {
      dups.forEach(([id, docs]) => {
        resolutionNeeded.push({
          type: 'sameLanguage',
          language: lang,
          conflictId: id,
          documents: docs,
          severity: 'high'
        });
      });
    });

    // 파일시스템 충돌 추가
    duplicates.filesystem.forEach(([key, docs]) => {
      resolutionNeeded.push({
        type: 'filesystem',
        conflictKey: key,
        documents: docs,
        severity: 'medium'
      });
    });

    if (resolutionNeeded.length === 0) {
      console.log('🎉 No conflicts to resolve!');
      return { resolved: [], conflicts: [] };
    }

    console.log(`📋 Found ${resolutionNeeded.length} conflicts to resolve:\n`);

    const resolved = [];
    const conflicts = [];

    // 각 충돌 해결 시도
    for (const conflict of resolutionNeeded) {
      try {
        const resolution = await this.resolveConflict(conflict, strategy, dryRun);
        resolved.push(resolution);
        
        console.log(`✅ ${conflict.type} conflict resolved:`);
        console.log(`   Original: ${conflict.conflictId || conflict.conflictKey}`);
        resolution.changes.forEach(change => {
          console.log(`   → ${change.oldId} → ${change.newId} (${change.method})`);
        });
        console.log('');
      } catch (error) {
        conflicts.push({
          conflict,
          error: error.message
        });
        
        console.log(`❌ Failed to resolve ${conflict.type} conflict:`);
        console.log(`   ${conflict.conflictId || conflict.conflictKey}: ${error.message}`);
        console.log('');
      }
    }

    // 요약 출력
    console.log('📊 Resolution Summary:');
    console.log(`   Total Conflicts: ${resolutionNeeded.length}`);
    console.log(`   Resolved: ${resolved.length}`);
    console.log(`   Failed: ${conflicts.length}`);

    if (conflicts.length > 0) {
      console.log('\n⚠️  Some conflicts could not be resolved automatically.');
      console.log('   Manual intervention may be required.');
    } else {
      console.log('\n🎉 All conflicts resolved successfully!');
    }

    return { resolved, conflicts };
  }

  generateHierarchicalId(sourcePath, language) {
    // 언어 프리픽스 제거
    const relativePath = sourcePath.replace(`${language}/`, '');
    
    // 확장자 제거
    const withoutExt = relativePath.replace(/\.md$/, '');
    
    // 경로 분할
    const pathParts = withoutExt.split('/');
    
    // 간단한 더블 대시 방식: 경로는 --, 단어 내부는 -
    return pathParts.join('--').toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-{3,}/g, '--')  // 3개 이상 연속 대시를 --로 변환
      .replace(/^-+|-+$/g, ''); // 앞뒤 대시 제거
  }

  detectAmbiguityRisk(documents) {
    console.log('🔍 Analyzing ambiguity risks...\n');
    
    const risks = [];
    const idMap = new Map();
    
    // ID별로 문서들 그룹핑
    documents.forEach(doc => {
      if (!idMap.has(doc.id)) {
        idMap.set(doc.id, []);
      }
      idMap.get(doc.id).push(doc);
    });
    
    // 각 ID에 대해 잠재적 모호성 검사
    for (const [id, docs] of idMap.entries()) {
      if (docs.length > 1) {
        // 이미 실제 중복
        risks.push({
          type: 'actual_duplicate',
          id: id,
          documents: docs,
          severity: 'high',
          reason: 'Multiple documents have the same ID'
        });
        continue;
      }
      
      const doc = docs[0];
      const pathParts = doc.sourcePath
        .replace(`${doc.language}/`, '')
        .replace(/\.md$/, '')
        .split('/');
      
      if (pathParts.length > 2 && pathParts.some(part => part.includes('-'))) {
        // 복잡한 경로 + 하이픈 포함 = 모호성 위험
        const riskLevel = this.calculateAmbiguityRisk(pathParts);
        
        if (riskLevel > 0.3) {
          risks.push({
            type: 'ambiguity_risk',
            id: id,
            documents: [doc],
            severity: riskLevel > 0.7 ? 'high' : riskLevel > 0.5 ? 'medium' : 'low',
            reason: `Path with ${pathParts.length} levels and hyphens may cause conflicts`,
            pathParts: pathParts,
            suggestedNewId: this.generateHierarchicalId(doc.sourcePath, doc.language)
          });
        }
      }
    }
    
    return risks;
  }
  
  calculateAmbiguityRisk(pathParts) {
    let risk = 0;
    
    // 경로 깊이에 따른 위험도
    risk += Math.min(pathParts.length * 0.1, 0.4);
    
    // 하이픈 포함 부분의 수에 따른 위험도
    const hyphenParts = pathParts.filter(part => part.includes('-')).length;
    risk += hyphenParts * 0.2;
    
    // 전체 하이픈 개수에 따른 위험도
    const totalHyphens = pathParts.join('').split('-').length - 1;
    risk += Math.min(totalHyphens * 0.05, 0.3);
    
    return Math.min(risk, 1.0);
  }

  async resolveConflict(conflict, strategy, dryRun) {
    const resolutionMethods = {
      'hierarchical-separator': (docs) => {
        return docs.map(doc => {
          const newId = this.generateHierarchicalId(doc.sourcePath, doc.language);
          return {
            document: doc,
            oldId: doc.id,
            newId: newId,
            method: 'hierarchical-separator'
          };
        });
      },
      
      'path-hierarchy': (docs) => {
        return docs.map((doc, index) => {
          const pathParts = doc.sourcePath
            .replace(`${doc.language}/`, '')
            .replace(/\.md$/, '')
            .split('/');
          
          const newId = pathParts.join('-').toLowerCase()
            .replace(/[^a-z0-9-]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
          return {
            document: doc,
            oldId: doc.id,
            newId: newId,
            method: 'path-hierarchy'
          };
        });
      },
      
      'numeric-suffix': (docs) => {
        return docs.map((doc, index) => ({
          document: doc,
          oldId: doc.id,
          newId: index === 0 ? doc.id : `${doc.id}-${index + 1}`,
          method: 'numeric-suffix'
        }));
      },
      
      'category-prefix': (docs) => {
        return docs.map(doc => ({
          document: doc,
          oldId: doc.id,
          newId: doc.id.startsWith(doc.category) ? doc.id : `${doc.category}-${doc.id}`,
          method: 'category-prefix'
        }));
      }
    };

    // 전략 선택
    let selectedMethod;
    if (strategy === 'auto') {
      // 자동 전략: path-hierarchy → category-prefix → numeric-suffix
      if (conflict.type === 'filesystem') {
        selectedMethod = 'path-hierarchy';
      } else {
        selectedMethod = 'category-prefix';
      }
    } else {
      selectedMethod = strategy;
    }

    if (!resolutionMethods[selectedMethod]) {
      throw new Error(`Unknown resolution strategy: ${selectedMethod}`);
    }

    const changes = resolutionMethods[selectedMethod](conflict.documents);
    
    // 해결 결과 검증
    const newIds = changes.map(c => c.newId);
    const uniqueNewIds = new Set(newIds);
    
    if (newIds.length !== uniqueNewIds.size) {
      // 여전히 중복이면 numeric-suffix로 fallback
      if (selectedMethod !== 'numeric-suffix') {
        return this.resolveConflict(conflict, 'numeric-suffix', dryRun);
      } else {
        throw new Error('Could not resolve conflict even with numeric suffix');
      }
    }

    // 실제 적용 (dry run이 아닌 경우)
    if (!dryRun) {
      for (const change of changes) {
        await this.applyIdChange(change);
      }
    }

    return {
      conflict,
      strategy: selectedMethod,
      changes,
      applied: !dryRun
    };
  }

  async applyIdChange(change) {
    const { document, oldId, newId } = change;
    
    if (oldId === newId) {
      return; // 변경 없음
    }

    try {
      // priority.json 파일 업데이트
      const priorityPath = path.join(document.dataDir, 'priority.json');
      const priorityContent = await fs.readFile(priorityPath, 'utf-8');
      const priority = JSON.parse(priorityContent);
      
      priority.document.id = newId;
      priority.metadata.updated = new Date().toISOString().split('T')[0];
      
      await fs.writeFile(priorityPath, JSON.stringify(priority, null, 2), 'utf-8');
      
      // 디렉토리 이름 변경
      const oldDir = document.dataDir;
      const newDir = oldDir.replace(new RegExp(`${oldId}$`), newId);
      
      if (oldDir !== newDir) {
        await fs.rename(oldDir, newDir);
      }
      
      console.log(`   📝 Updated: ${oldId} → ${newId}`);
    } catch (error) {
      throw new Error(`Failed to apply ID change ${oldId} → ${newId}: ${error.message}`);
    }
  }

  async analyzeAmbiguityRisk(language = null) {
    console.log('🔍 Analyzing path ambiguity risks...\n');
    
    const languages = language ? [language] : ['en', 'ko'];
    const allRisks = [];
    let totalDocs = 0;

    for (const lang of languages) {
      try {
        const targets = await this.scanWorkTargets(lang);
        totalDocs += targets.length;
        
        const documents = targets.map(target => ({
          ...target,
          language: lang
        }));
        
        const risks = this.detectAmbiguityRisk(documents);
        allRisks.push(...risks);
        
        console.log(`📊 ${lang.toUpperCase()} Analysis:`);
        console.log(`   Total documents: ${targets.length}`);
        console.log(`   High risk: ${risks.filter(r => r.severity === 'high').length}`);
        console.log(`   Medium risk: ${risks.filter(r => r.severity === 'medium').length}`);
        console.log(`   Low risk: ${risks.filter(r => r.severity === 'low').length}`);
        console.log('');
      } catch (error) {
        console.warn(`⚠️  Failed to analyze ${lang}: ${error.message}`);
      }
    }

    // 상세 위험 보고
    if (allRisks.length > 0) {
      console.log('🚨 Detailed Risk Analysis:\n');
      
      const highRisks = allRisks.filter(r => r.severity === 'high');
      if (highRisks.length > 0) {
        console.log('🔴 HIGH RISK (Immediate attention needed):');
        highRisks.forEach(risk => {
          console.log(`   ⚠️  ID: "${risk.id}"`);
          console.log(`      Path: ${risk.documents[0].sourcePath}`);
          console.log(`      Reason: ${risk.reason}`);
          if (risk.suggestedNewId) {
            console.log(`      Suggested: ${risk.suggestedNewId}`);
          }
          console.log('');
        });
      }

      const mediumRisks = allRisks.filter(r => r.severity === 'medium');
      if (mediumRisks.length > 0) {
        console.log('🟡 MEDIUM RISK (Monitor for future conflicts):');
        mediumRisks.slice(0, 5).forEach(risk => {
          console.log(`   ⚠️  ID: "${risk.id}" → Suggested: ${risk.suggestedNewId}`);
        });
        if (mediumRisks.length > 5) {
          console.log(`   ... and ${mediumRisks.length - 5} more`);
        }
        console.log('');
      }
    }

    // 요약
    console.log('📋 Summary:');
    console.log(`   Total documents analyzed: ${totalDocs}`);
    console.log(`   Documents at risk: ${allRisks.length}`);
    console.log(`   High priority fixes needed: ${allRisks.filter(r => r.severity === 'high').length}`);
    
    if (allRisks.length === 0) {
      console.log('\n🎉 No ambiguity risks detected!');
    } else {
      console.log('\n💡 Use "migrate-hierarchical" command to resolve these risks.');
    }

    return allRisks;
  }

  async migrateToHierarchical(language = null, options = {}) {
    const dryRun = options.dryRun || false;
    const category = options.category;
    
    console.log(`🔄 ${dryRun ? 'Analyzing' : 'Migrating to'} hierarchical ID system...`);
    if (dryRun) {
      console.log('   (Dry run mode - no changes will be made)');
    }
    if (category) {
      console.log(`   Filtering by category: ${category}`);
    }
    console.log('');

    const languages = language ? [language] : ['en', 'ko'];
    const allCandidates = [];
    
    // 마이그레이션 후보 수집
    for (const lang of languages) {
      try {
        const targets = await this.scanWorkTargets(lang);
        
        const candidates = targets
          .map(target => ({ ...target, language: lang }))
          .filter(doc => {
            // 카테고리 필터
            if (category && doc.category !== category) {
              return false;
            }
            
            const pathParts = doc.sourcePath
              .replace(`${doc.language}/`, '')
              .replace(/\.md$/, '')
              .split('/');
            
            // 복잡한 경로만 마이그레이션 대상
            if (pathParts.length <= 2) {
              return false;
            }
            
            // 새 ID가 기존과 다른 경우만
            const newId = this.generateHierarchicalId(doc.sourcePath, doc.language);
            return newId !== doc.id;
          });
        
        allCandidates.push(...candidates);
      } catch (error) {
        console.warn(`⚠️  Failed to scan ${lang}: ${error.message}`);
      }
    }

    if (allCandidates.length === 0) {
      console.log('🎉 No documents need hierarchical migration!');
      return { migrated: [], skipped: [] };
    }

    console.log(`📋 Found ${allCandidates.length} candidates for migration:\n`);

    const migrated = [];
    const failed = [];

    // 각 후보에 대해 마이그레이션 실행
    for (const candidate of allCandidates) {
      try {
        const oldId = candidate.id;
        const newId = this.generateHierarchicalId(candidate.sourcePath, candidate.language);
        
        console.log(`📝 ${oldId} → ${newId}`);
        console.log(`   Path: ${candidate.sourcePath}`);
        
        if (!dryRun) {
          const change = {
            document: candidate,
            oldId: oldId,
            newId: newId
          };
          
          await this.applyIdChange(change);
        }
        
        migrated.push({
          document: candidate,
          oldId: oldId,
          newId: newId,
          applied: !dryRun
        });
        
        console.log('');
      } catch (error) {
        failed.push({
          document: candidate,
          error: error.message
        });
        
        console.log(`❌ Failed: ${error.message}`);
        console.log('');
      }
    }

    // 마이그레이션 결과 요약
    console.log('📊 Migration Summary:');
    console.log(`   Total candidates: ${allCandidates.length}`);
    console.log(`   Successfully migrated: ${migrated.length}`);
    console.log(`   Failed: ${failed.length}`);

    if (failed.length > 0) {
      console.log('\n⚠️  Some migrations failed:');
      failed.forEach(failure => {
        console.log(`   ${failure.document.id}: ${failure.error}`);
      });
    }

    if (migrated.length > 0 && !dryRun) {
      console.log('\n✅ Migration completed! Run "check-duplicates" to verify results.');
    } else if (migrated.length > 0 && dryRun) {
      console.log('\n💡 Run without --dry-run to apply these changes.');
    }

    return { migrated, failed };
  }
}

async function main() {
  const [,, command, ...args] = process.argv;
  const workQueue = new WorkQueueManager();
  
  await workQueue.initialize();

  try {
    switch (command) {
      case 'list':
        const language = args[0] || 'en';
        const showAll = args.includes('--all');
        await workQueue.listTargets(language, showAll);
        break;

      case 'next':
        await workQueue.getNext(args[0] || 'en');
        break;

      case 'status':
        await workQueue.showStatus(args[0] || 'en');
        break;

      case 'reset':
        await workQueue.resetState(args[0]);
        break;

      case 'complete':
        if (!args[0]) {
          console.error('❌ Target ID required for complete command');
          process.exit(1);
        }
        await workQueue.completeWork(args[0], args[1] || 'en');
        break;

      case 'skip':
        if (!args[0]) {
          console.error('❌ Target ID required for skip command');
          process.exit(1);
        }
        await workQueue.skipWork(args[0], args[1] || 'en');
        break;

      case 'check-duplicates':
        await workQueue.checkDuplicates(args[0]);
        break;

      case 'resolve-duplicates':
        const dryRun = args.includes('--dry-run');
        const strategy = args.find(arg => arg.startsWith('--strategy='))?.split('=')[1] || 'auto';
        const targetLang = args.find(arg => !arg.startsWith('--')) || null;
        
        await workQueue.resolveDuplicates(targetLang, { dryRun, strategy });
        break;

      case 'check-ambiguity':
        await workQueue.analyzeAmbiguityRisk(args[0]);
        break;

      case 'migrate-hierarchical':
        const migrateDryRun = args.includes('--dry-run');
        const migrateCategory = args.find(arg => arg.startsWith('--category='))?.split('=')[1];
        const migrateLang = args.find(arg => !arg.startsWith('--')) || null;
        
        await workQueue.migrateToHierarchical(migrateLang, { 
          dryRun: migrateDryRun, 
          category: migrateCategory 
        });
        break;

      default:
        console.log(`📋 Work Queue CLI - Sequential Task Manager

Usage: node work-queue-cli.cjs <command> [options]

Commands:
  list [language] [--all]              모든 작업 대상 나열 (기본: 미완료만)
  next [language]                      다음 작업 대상 반환
  status [language]                    작업 상태 요약
  reset [language]                     작업 큐 초기화 (언어 지정시 해당 언어만)
  complete <id> [language]             작업 완료 처리
  skip <id> [language]                 작업 건너뛰기
  check-duplicates [language]          중복 ID 검사
  resolve-duplicates [language] [opts] 중복 ID 자동 해결
  check-ambiguity [language]           경로 모호성 위험 분석
  migrate-hierarchical [language] [opts] 계층적 ID 시스템으로 마이그레이션

Duplicate Resolution Options:
  --dry-run                           변경하지 않고 분석만 실행
  --strategy=<method>                 해결 전략 (auto|hierarchical-separator|path-hierarchy|category-prefix|numeric-suffix)

Migration Options:
  --dry-run                           변경하지 않고 분석만 실행
  --category=<name>                   특정 카테고리만 마이그레이션

Examples:
  node work-queue-cli.cjs next en                    # 다음 영어 작업 대상
  node work-queue-cli.cjs list ko                    # 한국어 작업 목록
  node work-queue-cli.cjs complete api-action-only en
  node work-queue-cli.cjs check-duplicates           # 모든 언어 중복 검사
  node work-queue-cli.cjs check-ambiguity en         # 영어 모호성 위험 분석
  node work-queue-cli.cjs migrate-hierarchical --dry-run --category=api
  node work-queue-cli.cjs resolve-duplicates --strategy=hierarchical-separator

Languages: en, ko, ja`);
    }
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { WorkQueueManager };