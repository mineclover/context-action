import styles from './LiveUsecaseRecipe.module.css';
import { useLiveUsecaseFacade } from './useLiveUsecaseFacade';

const resources = [
  { id: 'design-system', label: 'Design system' },
  { id: 'production', label: 'Production workspace' },
  { id: 'analytics', label: 'Analytics' },
];

const phaseLabels = {
  idle: '입력 대기',
  validating: '검증 중',
  packaging: '패키징 중',
  ready: '준비 완료',
  blocked: '검증 차단',
} as const;

export function LiveUsecaseRecipe() {
  const vm = useLiveUsecaseFacade();

  return (
    <div className={styles.recipe}>
      <div className={styles.meta}>
        <span className={styles.kicker}>Recipe preview</span>
        <span
          className={`${styles.phase} ${styles[`phase${vm.workflow.phase}`]}`}
        >
          {phaseLabels[vm.workflow.phase]}
        </span>
      </div>

      <div className={styles.boundary} aria-label="Usecase boundaries">
        <span>Contract</span>
        <span>Runtime</span>
        <span>Facade</span>
        <span>Recipe</span>
      </div>

      <label className={styles.field}>
        <span>Resource</span>
        <select
          value={vm.workflow.resourceId}
          onChange={(event) => vm.commands.selectResource(event.target.value)}
        >
          {resources.map((resource) => (
            <option key={resource.id} value={resource.id}>
              {resource.label}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        <span>Request reason</span>
        <textarea
          value={vm.workflow.reason}
          onChange={(event) => vm.commands.changeReason(event.target.value)}
          placeholder="예: 배포 전 컴포넌트 계약을 검증하기 위해 접근이 필요합니다."
          rows={3}
        />
      </label>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.primary}
          onClick={() => void vm.commands.submit()}
          disabled={vm.isBusy}
        >
          {vm.isBusy ? 'Running usecase…' : 'Run usecase'}
        </button>
        <button
          type="button"
          className={styles.secondary}
          onClick={vm.commands.reset}
        >
          Reset
        </button>
      </div>

      {vm.workflow.error && (
        <div className={styles.error} role="alert">
          {vm.workflow.error}
        </div>
      )}

      {vm.workflow.packet && (
        <div className={styles.success}>
          <strong>Facade result</strong>
          <span>
            {vm.workflow.packet.scope} · {vm.workflow.packet.priority} priority
            review packet
          </span>
        </div>
      )}

      <div className={styles.activity}>
        <div className={styles.activityTitle}>
          <strong>Activity stream</strong>
          <span>Store selector</span>
        </div>
        {vm.activity.map((event) => (
          <div className={styles.activityRow} key={event.id}>
            <span className={`${styles.dot} ${styles[`dot${event.tone}`]}`} />
            <span>
              <strong>{event.label}</strong>
              <small>
                {event.layer} · {event.detail}
              </small>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
