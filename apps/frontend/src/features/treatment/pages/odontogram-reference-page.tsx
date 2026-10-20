'use client';

import { useMemo, useState } from 'react';
import { Alert, Card, CardBody, FormLabel, FormSelect } from 'react-bootstrap';
import { Odontogram } from '@/features/odontogram';
import {
  TREATMENT_ACT_STATUSES,
  type TreatmentActCode,
  type TreatmentActStatus,
} from '../model/treatment';
import { mapTreatmentVisitToOdontogram } from '../model/treatment-odontogram.mapper';
import {
  createOdontogramActReference,
  ODONTOGRAM_ACT_REFERENCE_CASES,
} from '../mock/odontogram-reference.mock';
import { ClinicalRecordDetails } from '../components/clinical-record-details';

export function OdontogramReferencePage() {
  const [code, setCode] = useState<TreatmentActCode>('CROWN_REPLACEMENT');
  const [status, setStatus] = useState<TreatmentActStatus>('PLANNED');
  const visit = useMemo(
    () => createOdontogramActReference(code, status),
    [code, status],
  );
  const projection = useMemo(
    () => mapTreatmentVisitToOdontogram(visit),
    [visit],
  );
  return (
    <>
      <h1 className="h4">Odontogram visual reference</h1>
      <Alert variant="info">
        Synthetic examples for visual review. This page does not read or save
        patient records.
      </Alert>
      <Card>
        <CardBody>
          <div className="row g-3 mb-3">
            <div className="col-md-8">
              <FormLabel htmlFor="reference-act">Treatment act</FormLabel>
              <FormSelect
                id="reference-act"
                value={code}
                onChange={(event) =>
                  setCode(event.currentTarget.value as TreatmentActCode)
                }
              >
                {ODONTOGRAM_ACT_REFERENCE_CASES.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.label}
                  </option>
                ))}
              </FormSelect>
            </div>
            <div className="col-md-4">
              <FormLabel htmlFor="reference-status">Lifecycle state</FormLabel>
              <FormSelect
                id="reference-status"
                value={status}
                onChange={(event) =>
                  setStatus(event.currentTarget.value as TreatmentActStatus)
                }
              >
                {TREATMENT_ACT_STATUSES.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </FormSelect>
            </div>
          </div>
          <ClinicalRecordDetails code={code} details={visit.acts[0].details} />
          {projection.issues.map(({ recordId, reason }) => (
            <Alert key={recordId} variant="warning">
              {reason}
            </Alert>
          ))}
          <Odontogram
            data={projection.data}
            selection={{
              activeToothPosition: null,
              selectedToothPositions: [],
            }}
            view="side-and-occlusal"
            interactionMode="view"
            ariaLabel="Synthetic treatment reference odontogram"
          />
        </CardBody>
      </Card>
    </>
  );
}
