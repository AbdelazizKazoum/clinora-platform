import { Badge, Card, CardBody, FormSelect } from 'react-bootstrap';
import Icon from '@/components/wrappers/Icon';
import type { MockTreatmentActor } from '../model/treatment-workspace';
import {
  treatmentVisitStatusLabels,
  type TreatmentVisit,
  type TreatmentPatientSummary,
} from '../model/treatment';
import { visitStatusVariant } from './treatment-presentation';
import styles from './treatment-workspace.module.scss';

export function PatientVisitHeader({
  actor,
  dentist,
  assistant,
  patient,
  onActorChange,
  visit,
}: {
  readonly actor: MockTreatmentActor;
  readonly dentist: MockTreatmentActor;
  readonly assistant: MockTreatmentActor;
  readonly patient: TreatmentPatientSummary;
  readonly onActorChange: (actor: MockTreatmentActor) => void;
  readonly visit: TreatmentVisit;
}) {
  return (
    <Card className={`${styles.patientHeader} mb-3`}>
      <CardBody>
        <div className="d-flex flex-wrap align-items-center gap-3">
          <div className="avatar-md rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center border border-2 border-primary">
            <Icon icon="user" className="fs-2 text-primary" />
          </div>
          <div className="flex-grow-1">
            <div className="d-flex flex-wrap align-items-center gap-2">
              <h4 className="mb-0">{patient.name}</h4>
              {patient.allergies.map((allergy) => (
                <Badge
                  key={allergy}
                  bg="danger"
                  className="badge-soft-danger text-danger"
                >
                  {allergy} allergy
                </Badge>
              ))}
              {patient.alerts.map((alert) => (
                <Badge
                  key={alert}
                  bg="warning"
                  className="badge-soft-warning text-warning"
                >
                  {alert}
                </Badge>
              ))}
            </div>
            <p className="text-muted mb-0 mt-1">
              {patient.sex} · Born {patient.dateOfBirth} · Chair{' '}
              {visit.chairId ?? '—'} · Visit {visit.id}
            </p>
          </div>
          <div className="text-end">
            <Badge className="mb-2" bg={visitStatusVariant(visit.status)}>
              {treatmentVisitStatusLabels[visit.status]}
            </Badge>
            <FormSelect
              aria-label="Demo actor"
              className={styles.actorSelect}
              onChange={(event) =>
                onActorChange(
                  event.currentTarget.value === 'assistant'
                    ? assistant
                    : dentist,
                )
              }
              size="sm"
              value={actor.role === 'doctor' ? 'doctor' : 'assistant'}
            >
              <option value="doctor">Dentist · {dentist.name}</option>
              <option value="assistant">Assistant · {assistant.name}</option>
            </FormSelect>
            <small className="text-muted d-block mt-1">Demo role preview</small>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
