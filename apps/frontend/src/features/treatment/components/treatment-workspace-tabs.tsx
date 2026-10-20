import { Card } from 'react-bootstrap';
import Icon from '@/components/wrappers/Icon';
import type { TreatmentVisit } from '../model/treatment';
import styles from './treatment-workspace.module.scss';

export type WorkspaceTab =
  | 'chart'
  | 'periodontal'
  | 'findings'
  | 'treatment-plans'
  | 'handoff';

export function TreatmentWorkspaceTabs({
  activeTab,
  onTabChange,
  visit,
}: {
  readonly activeTab: WorkspaceTab;
  readonly onTabChange: (tab: WorkspaceTab) => void;
  readonly visit: TreatmentVisit;
}) {
  return (
    <Card className={`${styles.modernTabs} mb-3`}>
      <div
        className="d-flex gap-1"
        role="tablist"
        aria-label="Treatment workspace sections"
      >
        {(
          [
            [
              'chart',
              'Odontogram & tooth details',
              'smile',
              visit.findings.length + visit.acts.length,
            ],
            [
              'periodontal',
              'Periodontal chart',
              'activity',
              visit.findings.filter((f) => f.target.toothNumbers.length === 0)
                .length,
            ],
            [
              'findings',
              'Clinical findings',
              'stethoscope',
              visit.findings.length,
            ],
            [
              'treatment-plans',
              'Treatment plans',
              'clipboard-list',
              visit.acts.length,
            ],
            [
              'handoff',
              'Documentation handoff',
              'users',
              visit.documentationHandoff ? 1 : 0,
            ],
          ] as const
        ).map(([tab, label, icon, count]) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            className={`${styles.modernTab} ${activeTab === tab ? styles.active : ''}`}
            onClick={() => onTabChange(tab)}
          >
            <Icon icon={icon} />
            <span>{label}</span>
            {count > 0 && <span className={styles.tabBadge}>{count}</span>}
          </button>
        ))}
      </div>
    </Card>
  );
}
