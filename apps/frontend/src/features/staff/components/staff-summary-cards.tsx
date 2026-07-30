import Icon from '@/components/wrappers/Icon';
import { Card, CardBody, Col, Row } from 'react-bootstrap';

import type { StaffSummary } from '../model';

interface StaffSummaryItem {
  icon: string;
  label: string;
  value: number;
  variant: string;
}

const getSummaryItems = (summary: StaffSummary): StaffSummaryItem[] => [
  {
    icon: 'users',
    label: 'Total Staff',
    value: summary.total,
    variant: 'primary',
  },
  {
    icon: 'user-check',
    label: 'Active',
    value: summary.active,
    variant: 'success',
  },
  {
    icon: 'calendar-clock',
    label: 'On Leave',
    value: summary.onLeave,
    variant: 'warning',
  },
  {
    icon: 'user-x',
    label: 'Inactive',
    value: summary.inactive,
    variant: 'danger',
  },
];

const StaffSummaryCards = ({ summary }: { summary: StaffSummary }) => (
  <Row>
    {getSummaryItems(summary).map((item) => (
      <Col key={item.label} xs={12} sm={6} xl={3}>
        <Card>
          <CardBody>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <p className="text-muted text-uppercase fs-xs mb-2">
                  {item.label}
                </p>
                <h3 className="mb-0">{item.value}</h3>
              </div>
              <div className="avatar-sm">
                <span
                  className={`avatar-title rounded-circle bg-${item.variant}-subtle text-${item.variant} fs-24`}
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

export default StaffSummaryCards;
