import { Placeholder, Table } from 'react-bootstrap';

const PatientTableSkeleton = () => (
  <div className="table-responsive">
    <Table
      responsive
      hover
      className="table table-custom table-centered table-select w-100 mb-0"
      aria-hidden="true"
    >
      <thead className="bg-light align-middle bg-opacity-25 thead-sm">
        <tr className="text-uppercase fs-xxs">
          <th>
            <Placeholder className="col-5" />
          </th>
          <th>
            <Placeholder className="col-7" />
          </th>
          <th>
            <Placeholder className="col-6" />
          </th>
          <th>
            <Placeholder className="col-6" />
          </th>
          <th>
            <Placeholder className="col-8" />
          </th>
          <th>
            <Placeholder className="col-7" />
          </th>
          <th>
            <Placeholder className="col-5" />
          </th>
          <th>
            <Placeholder className="col-6" />
          </th>
        </tr>
      </thead>
      <tbody className="placeholder-glow">
        {Array.from({ length: 8 }, (_, index) => (
          <tr key={index}>
            <td>
              <Placeholder className="col-4" />
            </td>
            <td>
              <div className="d-flex align-items-center gap-2">
                <Placeholder
                  className="rounded-circle"
                  style={{ height: 32, width: 32 }}
                />
                <div className="w-100">
                  <Placeholder className="col-7 d-block mb-1" />
                  <Placeholder size="xs" className="col-9" />
                </div>
              </div>
            </td>
            <td>
              <Placeholder className="col-8" />
            </td>
            <td>
              <Placeholder className="col-5" />
            </td>
            <td>
              <Placeholder className="col-7" />
            </td>
            <td>
              <Placeholder className="col-7" />
            </td>
            <td>
              <Placeholder className="col-6" />
            </td>
            <td>
              <Placeholder className="col-8" />
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  </div>
);

export default PatientTableSkeleton;
