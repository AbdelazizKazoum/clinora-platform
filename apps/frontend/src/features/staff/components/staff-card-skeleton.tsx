import { Card, CardBody, Placeholder } from 'react-bootstrap';

const StaffCardSkeleton = () => (
  <Card className="h-100" aria-hidden="true">
    <CardBody className="d-flex align-items-start placeholder-glow">
      <Placeholder
        className="rounded-circle me-3 flex-shrink-0"
        style={{ height: 64, width: 64 }}
      />

      <div className="flex-grow-1">
        <div className="d-flex justify-content-between gap-3">
          <div className="w-75">
            <Placeholder className="col-8 d-block mb-2" />
            <Placeholder size="xs" className="col-6" />
          </div>
          <Placeholder className="col-2" />
        </div>

        <Placeholder className="col-4 d-block my-3" />
        <Placeholder className="col-10 d-block mb-2" />
        <Placeholder className="col-7 d-block mb-2" />
        <Placeholder className="col-6 d-block" />
      </div>
    </CardBody>
  </Card>
);

export default StaffCardSkeleton;
