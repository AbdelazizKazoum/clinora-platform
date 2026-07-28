import PageBreadcrumb from '@/components/PageBreadcrumb';
import { Col, Row } from 'react-bootstrap';
import PatientCreateForm from '../components/patient-create-form';

const PatientNewPage = () => {
  return (
    <>
      <PageBreadcrumb title="Add Patient" subtitle="Patients" />

      <Row>
        <Col xl={9}>
          <PatientCreateForm />
        </Col>
      </Row>
    </>
  );
};

export default PatientNewPage;
