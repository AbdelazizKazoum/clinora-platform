import PageBreadcrumb from '@/components/PageBreadcrumb';
import { Col, Row } from 'react-bootstrap';
import PatientCreateForm from '../components/patient-create-form';

const PatientNewPage = () => {
  return (
    <>
      <PageBreadcrumb title="Add/Edit Patient" subtitle="Patients" />

      <Row className="justify-content-center">
        <Col lg={11} xl={10} xxl={8}>
          <PatientCreateForm />
        </Col>
      </Row>
    </>
  );
};

export default PatientNewPage;
