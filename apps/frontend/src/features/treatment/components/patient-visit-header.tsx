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
  secretary,
  patient,
  onActorChange,
  visit,
}: {
  readonly actor: MockTreatmentActor;
  readonly dentist: MockTreatmentActor;
  readonly assistant: MockTreatmentActor;
  readonly secretary: MockTreatmentActor;
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
              <h4 className={`${styles.patientName} mb-0`}>{patient.name}</h4>
            </div>
            <p className={`${styles.patientMeta} mb-0 mt-1`}>
              {patient.sex} · Born {patient.dateOfBirth} · Chair{' '}
              {visit.chairId ?? '—'} · Visit {visit.id}
            </p>
            {(patient.allergies.length > 0 || patient.alerts.length > 0) && (
              <div className="d-flex flex-wrap gap-2 mt-2">
                {patient.allergies.map((allergy) => (
                  <Badge
                    key={allergy}
                    bg="danger"
                    className={`${styles.alertBadge} text-white d-flex align-items-center gap-1 px-2 py-1`}
                  >
                    <Icon icon="alert-circle" className="fs-6" />
                    <span className="fw-semibold">{allergy} allergy</span>
                  </Badge>
                ))}
                {patient.alerts.map((alert) => (
                  <Badge
                    key={alert}
                    bg="warning"
                    className={`${styles.alertBadge} text-dark d-flex align-items-center gap-1 px-2 py-1`}
                  >
                    <Icon icon="alert-triangle" className="fs-6" />
                    <span className="fw-semibold">{alert}</span>
                  </Badge>
                ))}
              </div>
            )}
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
                    : event.currentTarget.value === 'secretary'
                      ? secretary
                      : dentist,
                )
              }
              size="sm"
              value={
                actor.role === 'doctor'
                  ? 'doctor'
                  : actor.role === 'secretary'
                    ? 'secretary'
                    : 'assistant'
              }
            >
              <option value="doctor">Dentist · {dentist.name}</option>
              <option value="assistant">Assistant · {assistant.name}</option>
              <option value="secretary">Secretariat · {secretary.name}</option>
            </FormSelect>
            <small className="text-muted d-block mt-1">Demo role preview</small>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
