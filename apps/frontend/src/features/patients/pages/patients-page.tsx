import PageBreadcrumb from '@/components/PageBreadcrumb';
import { Col, Row } from 'react-bootstrap';
import PatientTable from '../components/patient-table';

const PatientsPage = () => {
  return (
    <>
      <PageBreadcrumb title="All Patients" subtitle="Patients" />

      <Row className="justify-content-center">
        <Col xxl={12}>
          <PatientTable />
        </Col>
      </Row>
    </>
  );
};

export default PatientsPage;
