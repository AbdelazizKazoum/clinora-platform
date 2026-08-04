import Icon from '@/components/wrappers/Icon';
import { Card, CardBody, Col, Row } from 'react-bootstrap';

import type { QueueStatus, WaitingRoomSummary } from '../model';

interface SummaryCardConfig {
  icon: string;
  label: string;
  status: QueueStatus;
  variant: string;
}

const summaryCardConfigs: SummaryCardConfig[] = [
  {
    icon: 'log-in',
    label: 'Arrived',
    status: 'ARRIVED',
    variant: 'info',
  },
  {
    icon: 'clock-3',
    label: 'Waiting',
    status: 'WAITING',
    variant: 'warning',
  },
  {
    icon: 'armchair',
    label: 'In Chair',
    status: 'IN_CHAIR',
    variant: 'primary',
  },
  {
    icon: 'circle-check-big',
    label: 'Completed',
    status: 'DONE',
    variant: 'success',
  },
];

export const WaitingRoomSummarySkeleton = () => (
  <Row aria-label="Loading waiting room summary">
    {summaryCardConfigs.map((item) => (
      <Col key={item.status} xs={6} xl={3}>
        <Card aria-hidden="true">
          <CardBody className="placeholder-glow">
            <div className="d-flex align-items-center justify-content-between">
              <div className="w-75">
                <span className="placeholder col-7 d-block mb-3" />
                <span className="placeholder col-4 d-block" />
              </div>
              <span
                className="placeholder rounded-circle"
                style={{ height: 40, width: 40 }}
              />
            </div>
          </CardBody>
        </Card>
      </Col>
    ))}
  </Row>
);

const WaitingRoomSummaryCards = ({
  summary,
}: {
  summary: WaitingRoomSummary;
}) => (
  <Row>
    {summaryCardConfigs.map((item) => (
      <Col key={item.status} xs={6} xl={3}>
        <Card>
          <CardBody className="py-3">
            <div className="d-flex align-items-center justify-content-between gap-2">
              <div>
                <p className="text-muted text-uppercase fs-xs mb-1">
                  {item.label}
                </p>
                <h3 className="mb-0">{summary[item.status]}</h3>
              </div>
              <div className="avatar-sm flex-shrink-0">
                <span
                  className={`avatar-title rounded-circle bg-${item.variant}-subtle text-${item.variant} fs-22`}
                >
                  <Icon icon={item.icon} />
                </span>
              </div>
            </div>
          </CardBody>
        </Card>
      </Col>
    ))}
  </Row>
);

export default WaitingRoomSummaryCards;
