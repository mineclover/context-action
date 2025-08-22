/**
 * @fileoverview Priority Calculation Controls Component (Modularized)
 * 
 * Advanced controls for configuring priority calculation algorithms
 * with real-time previews and comparison features.
 */

import React, { useState, useCallback } from 'react';
import { Card, Button, Badge } from '../../../../components/ui';
import type { Document, PriorityCalculationCriteria } from '../../types';
import { getPreviewStats, CALCULATION_PRESETS } from '../../utils';

interface PriorityCalculationControlsProps {
  criteria: PriorityCalculationCriteria;
  onCriteriaChange: (criteria: PriorityCalculationCriteria) => void;
  documents: Document[];
  onApplyCalculation: (criteria: PriorityCalculationCriteria) => void;
}

export function PriorityCalculationControls({
  criteria,
  onCriteriaChange,
  documents,
  onApplyCalculation
}: PriorityCalculationControlsProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>('default');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const applyPreset = useCallback((presetName: string) => {
    const preset = CALCULATION_PRESETS[presetName];
    if (preset) {
      onCriteriaChange(preset.criteria);
      setSelectedPreset(presetName);
    }
  }, [onCriteriaChange]);

  const updateCriteria = useCallback((updates: Partial<PriorityCalculationCriteria>) => {
    onCriteriaChange({ ...criteria, ...updates });
    setSelectedPreset('custom');
  }, [criteria, onCriteriaChange]);

  const previewStats = getPreviewStats(documents, criteria);

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">⚙️ Priority Calculation Controls</h2>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowAdvanced(!showAdvanced)}
            variant="outline"
            size="sm"
          >
            {showAdvanced ? '📊 Simple View' : '🔧 Advanced Controls'}
          </Button>
          <Button
            onClick={() => setPreviewMode(!previewMode)}
            variant={previewMode ? 'primary' : 'outline'}
            size="sm"
          >
            {previewMode ? '👁️ Preview ON' : '👁️ Preview Mode'}
          </Button>
        </div>
      </div>

      {/* Preset Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Calculation Presets</label>
        <div className="flex flex-wrap gap-2">
          {Object.entries(CALCULATION_PRESETS).map(([presetName, preset]) => (
            <Button
              key={presetName}
              onClick={() => applyPreset(presetName)}
              variant={selectedPreset === presetName ? 'primary' : 'outline'}
              size="sm"
              title={preset.description}
            >
              {presetName === 'default' ? '🏠 Default' :
               presetName === 'contentFocused' ? '📖 Content Focused' :
               presetName === 'collaborationFocused' ? '🤝 Collaboration' :
               presetName === 'timeSensitive' ? '⏰ Time Sensitive' : 
               '🛠️ Custom'}
            </Button>
          ))}
        </div>
      </div>

      {/* Preview Statistics */}
      {previewMode && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-3">📊 Calculation Preview</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="font-medium text-blue-800">Average Change</div>
              <div className="text-lg text-blue-600">{previewStats.averageChange} pts</div>
            </div>
            <div>
              <div className="font-medium text-blue-800">Max Change</div>
              <div className="text-lg text-blue-600">{previewStats.maxChange} pts</div>
            </div>
            <div>
              <div className="font-medium text-blue-800">Significant Changes</div>
              <div className="text-lg text-blue-600">
                {previewStats.significantChanges}/{previewStats.totalDocuments}
              </div>
            </div>
            <div>
              <div className="font-medium text-blue-800">Impact Level</div>
              <Badge variant={
                previewStats.averageChange > 15 ? 'danger' :
                previewStats.averageChange > 8 ? 'default' :
                previewStats.averageChange > 3 ? 'warning' : 'outline'
              }>
                {previewStats.averageChange > 15 ? 'High' :
                 previewStats.averageChange > 8 ? 'Medium' :
                 previewStats.averageChange > 3 ? 'Low' : 'Minimal'}
              </Badge>
            </div>
          </div>
        </div>
      )}

      {/* Basic Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {/* Document Size */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">
            📄 Document Size Weight: {Math.round(criteria.documentSize.weight * 100)}%
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={criteria.documentSize.weight}
            onChange={(e) => updateCriteria({
              documentSize: { ...criteria.documentSize, weight: parseFloat(e.target.value) }
            })}
            className="w-full"
          />
          <select
            value={criteria.documentSize.method}
            onChange={(e) => updateCriteria({
              documentSize: { ...criteria.documentSize, method: e.target.value as any }
            })}
            className="w-full text-xs border rounded px-2 py-1"
          >
            <option value="linear">Linear</option>
            <option value="logarithmic">Logarithmic</option>
            <option value="exponential">Exponential</option>
          </select>
        </div>

        {/* Category Weight */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">
            📂 Category Weight: {Math.round(criteria.category.weight * 100)}%
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={criteria.category.weight}
            onChange={(e) => updateCriteria({
              category: { ...criteria.category, weight: parseFloat(e.target.value) }
            })}
            className="w-full"
          />
          <div className="text-xs text-gray-600">
            Guide: {criteria.category.values.guide} | 
            Concept: {criteria.category.values.concept} |
            Examples: {criteria.category.values.examples}
          </div>
        </div>

        {/* Keyword Density */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">
            🔍 Keyword Weight: {Math.round(criteria.keywordDensity.weight * 100)}%
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={criteria.keywordDensity.weight}
            onChange={(e) => updateCriteria({
              keywordDensity: { ...criteria.keywordDensity, weight: parseFloat(e.target.value) }
            })}
            className="w-full"
          />
          <select
            value={criteria.keywordDensity.method}
            onChange={(e) => updateCriteria({
              keywordDensity: { ...criteria.keywordDensity, method: e.target.value as any }
            })}
            className="w-full text-xs border rounded px-2 py-1"
          >
            <option value="linear">Linear</option>
            <option value="logarithmic">Logarithmic</option>
            <option value="polynomial">Polynomial</option>
          </select>
        </div>
      </div>

      {/* Advanced Controls */}
      {showAdvanced && (
        <div className="space-y-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold">🔧 Advanced Algorithm Parameters</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cross References */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">
                🔗 Cross References (Weight: {Math.round(criteria.crossReferences.weight * 100)}%)
              </label>
              <input
                type="range"
                min="0"
                max="0.5"
                step="0.025"
                value={criteria.crossReferences.weight}
                onChange={(e) => updateCriteria({
                  crossReferences: { ...criteria.crossReferences, weight: parseFloat(e.target.value) }
                })}
                className="w-full"
              />
              <div className="flex items-center gap-2">
                <label className="text-xs">Boost:</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={criteria.crossReferences.boost}
                  onChange={(e) => updateCriteria({
                    crossReferences: { ...criteria.crossReferences, boost: parseInt(e.target.value) }
                  })}
                  className="w-16 text-xs border rounded px-1"
                />
                <label className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={criteria.crossReferences.diminishingReturns || false}
                    onChange={(e) => updateCriteria({
                      crossReferences: { ...criteria.crossReferences, diminishingReturns: e.target.checked }
                    })}
                  />
                  Diminishing Returns
                </label>
              </div>
            </div>

            {/* Recent Modification */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">
                ⏰ Recent Modification (Weight: {Math.round(criteria.recentModification.weight * 100)}%)
              </label>
              <input
                type="range"
                min="0"
                max="0.3"
                step="0.01"
                value={criteria.recentModification.weight}
                onChange={(e) => updateCriteria({
                  recentModification: { ...criteria.recentModification, weight: parseFloat(e.target.value) }
                })}
                className="w-full"
              />
              <div className="flex items-center gap-2">
                <label className="text-xs">Days:</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={criteria.recentModification.dayThreshold}
                  onChange={(e) => updateCriteria({
                    recentModification: { ...criteria.recentModification, dayThreshold: parseInt(e.target.value) }
                  })}
                  className="w-16 text-xs border rounded px-1"
                />
                <label className="text-xs">Decay Rate:</label>
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={criteria.recentModification.decayRate || 0}
                  onChange={(e) => updateCriteria({
                    recentModification: { ...criteria.recentModification, decayRate: parseFloat(e.target.value) }
                  })}
                  className="w-16 text-xs border rounded px-1"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button 
          onClick={() => onApplyCalculation(criteria)}
          variant="primary"
        >
          🔄 Apply Calculation
        </Button>
        <Button 
          onClick={() => applyPreset('default')}
          variant="outline"
        >
          ↻ Reset to Default
        </Button>
        <Button
          onClick={() => {
            const customPreset = { ...criteria };
            console.log('Custom Criteria JSON:', JSON.stringify(customPreset, null, 2));
            alert('Custom criteria JSON logged to console for export');
          }}
          variant="outline"
          size="sm"
        >
          💾 Export Criteria
        </Button>
      </div>

      {/* Algorithm Explanation */}
      <div className="mt-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
        <h4 className="text-sm font-semibold text-indigo-900 mb-2">🧮 Algorithm Overview</h4>
        <div className="text-xs text-indigo-800 space-y-1">
          <div><strong>Final Score = </strong>
            (Size × {Math.round(criteria.documentSize.weight * 100)}%) + 
            (Category × {Math.round(criteria.category.weight * 100)}%) + 
            (Keywords × {Math.round(criteria.keywordDensity.weight * 100)}%) + 
            (References × {Math.round(criteria.crossReferences.weight * 100)}%) + 
            (Recent × {Math.round(criteria.recentModification.weight * 100)}%) + 
            (Team × {Math.round(criteria.teamWorkload.weight * 100)}%)
          </div>
          <div className="text-indigo-600">
            Total Weight: {Math.round((criteria.documentSize.weight + criteria.category.weight + 
                                     criteria.keywordDensity.weight + criteria.crossReferences.weight + 
                                     criteria.recentModification.weight + criteria.teamWorkload.weight) * 100)}%
          </div>
        </div>
      </div>
    </Card>
  );
}

export default PriorityCalculationControls;