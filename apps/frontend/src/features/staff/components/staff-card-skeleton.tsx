import { Card, CardBody, Placeholder } from 'react-bootstrap';

const StaffCardSkeleton = () => (
  <Card className="h-100 border-0 shadow-sm" aria-hidden="true">
    <CardBody className="placeholder-glow">
      <Placeholder
        className="rounded-circle d-block mb-3"
        style={{ height: 72, width: 72 }}
      />

      <Placeholder className="col-7 d-block mb-2" />
      <Placeholder size="xs" className="col-5" />

      <hr className="my-3 border-dashed" />

      <div className="d-flex justify-content-between gap-3 mb-3">
        <div className="w-50">
          <Placeholder size="xs" className="col-7 d-block mb-2" />
          <Placeholder className="col-9 d-block" />
        </div>
        <div className="w-25 text-end">
          <Placeholder size="xs" className="col-12 d-block mb-2" />
          <Placeholder className="col-10 d-block ms-auto" />
        </div>
      </div>

      <Placeholder className="col-10 d-block mb-2" />
      <Placeholder className="col-7 d-block" />
    </CardBody>
  </Card>
);

export default StaffCardSkeleton;
