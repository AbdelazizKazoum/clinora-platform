import PageBreadcrumb from '@/components/PageBreadcrumb';
import Icon from '@/components/wrappers/Icon';
import { Button, Card, CardBody, Col, Row } from 'react-bootstrap';

const AppointmentSchedulePage = () => {
  return (
    <>
      <PageBreadcrumb title="Schedule" subtitle="Clinical" />

      <Row>
        <Col xs={12}>
          <Card>
            <CardBody className="d-flex flex-column flex-lg-row align-items-start align-items-lg-center justify-content-between gap-3">
              <div>
                <h4 className="fs-lg mb-1">Appointment schedule</h4>
                <p className="text-muted mb-0">
                  Calendar scheduling will be connected in the next appointment
                  tasks.
                </p>
              </div>

              <Button disabled variant="primary">
                <Icon icon="calendar-plus" className="me-2 align-middle" />
                New Appointment
              </Button>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default AppointmentSchedulePage;
