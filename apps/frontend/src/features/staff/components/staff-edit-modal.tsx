'use client';

import Icon from '@/components/wrappers/Icon';
import { ApiError } from '@/lib/api';
import { useNotificationStore } from '@/store';
import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  Alert,
  Button,
  Col,
  Form,
  FormControl,
  FormGroup,
  FormLabel,
  FormSelect,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  Row,
  Spinner,
} from 'react-bootstrap';

import { useUpdateStaffMember } from '../hooks';
import {
  getEditableStaffStatusOptions,
  isStaffDeactivationStatus,
  STAFF_ROLES,
  staffRoleLabels,
  staffStatusLabels,
  type StaffMember,
  type StaffRole,
  type StaffStatus,
} from '../model';
import {
  mapEditStaffFormToCommand,
  mapStaffMemberToEditStaffForm,
  validateEditStaffForm,
  type EditStaffFormErrors,
  type EditStaffFormField,
  type EditStaffFormValues,
} from '../schemas';

interface StaffEditModalProps {
  onHide: () => void;
  staffMember: StaffMember | null;
}

const requiredMark = <span className="text-danger">*</span>;

const getFieldErrorFromApiMessage = (
  message: string,
): Partial<Record<EditStaffFormField, string>> => {
  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes('email')) {
    return { email: message };
  }

  if (normalizedMessage.includes('avatar')) {
    return { avatar: message };
  }

  if (normalizedMessage.includes('phone')) {
    return { phone: message };
  }

  if (normalizedMessage.includes('status')) {
    return { status: message };
  }

  if (normalizedMessage.includes('role')) {
    return { role: message };
  }

  return {};
};

const mapSubmissionError = (error: unknown): EditStaffFormErrors => {
  if (error instanceof ApiError) {
    if (error.status === 409) {
      return {
        email: 'A staff member with this email already exists.',
      };
    }

    const message =
      error.message || 'Unable to update the staff member. Check the form and try again.';
    const fieldErrors = getFieldErrorFromApiMessage(message);

    if (Object.keys(fieldErrors).length > 0) {
      return fieldErrors;
    }

    return { form: message };
  }

  return {
    form:
      error instanceof Error
        ? error.message
        : 'Unable to update the staff member.',
  };
};

const requiresDeactivationConfirmation = (
  staffMember: StaffMember,
  values: EditStaffFormValues,
): boolean =>
  staffMember.status !== values.status &&
  isStaffDeactivationStatus(values.status);

const StaffEditModal = ({ onHide, staffMember }: StaffEditModalProps) => {
  const { isPending, updateStaffMember } = useUpdateStaffMember();
  const showNotification = useNotificationStore(
    (state) => state.showNotification,
  );
  const [values, setValues] = useState<EditStaffFormValues | null>(null);
  const [errors, setErrors] = useState<EditStaffFormErrors>({});
  const [wasSubmitted, setWasSubmitted] = useState(false);

  useEffect(() => {
    if (!staffMember) {
      setValues(null);
      setErrors({});
      setWasSubmitted(false);
      return;
    }

    setValues(mapStaffMemberToEditStaffForm(staffMember));
    setErrors({});
    setWasSubmitted(false);
  }, [staffMember]);

  const updateField = (
    field: EditStaffFormField,
    value: EditStaffFormValues[EditStaffFormField],
  ) => {
    if (!values) return;

    const nextValues = {
      ...values,
      [field]: value,
    };

    setValues(nextValues);

    if (wasSubmitted) {
      setErrors(validateEditStaffForm(nextValues).errors);
    }
  };

  const handleTextChange =
    (field: EditStaffFormField) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      updateField(field, event.currentTarget.value);
    };

  const handleRoleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    updateField('role', event.currentTarget.value as StaffRole);
  };

  const handleStatusChange = (event: ChangeEvent<HTMLSelectElement>) => {
    updateField('status', event.currentTarget.value as StaffStatus);
  };

  const handleClose = () => {
    if (isPending) return;

    onHide();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setWasSubmitted(true);

    if (!staffMember || !values) return;

    const validation = validateEditStaffForm(values);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    if (
      requiresDeactivationConfirmation(staffMember, values) &&
      !window.confirm(
        `${staffMember.fullName} will lose access to Clinora when marked inactive. Continue?`,
      )
    ) {
      return;
    }

    try {
      setErrors({});
      await updateStaffMember(mapEditStaffFormToCommand(staffMember, values));

      showNotification({
        message: 'Staff member updated successfully.',
        title: 'Staff member updated',
        variant: 'success',
      });
      onHide();
    } catch (error) {
      const nextErrors = mapSubmissionError(error);
      setErrors(nextErrors);
      showNotification({
        message:
          nextErrors.form ??
          nextErrors.email ??
          'Unable to update the staff member.',
        title: 'Staff request failed',
        variant: 'danger',
      });
    }
  };

  const statusOptions = staffMember
    ? getEditableStaffStatusOptions(staffMember.status)
    : [];

  return (
    <Modal show={staffMember !== null} onHide={handleClose} centered size="lg">
      <ModalHeader closeButton>
        <ModalTitle as="h5">
          <Icon icon="square-pen" className="me-1" />
          Edit Staff Member
        </ModalTitle>
      </ModalHeader>

      <Form noValidate onSubmit={handleSubmit}>
        <ModalBody>
          {errors.form && <Alert variant="danger">{errors.form}</Alert>}

          {values && (
            <Row className="g-3">
              <Col md={6}>
                <FormGroup>
                  <FormLabel htmlFor="edit-staff-first-name">
                    First Name {requiredMark}
                  </FormLabel>
                  <FormControl
                    autoComplete="given-name"
                    disabled={isPending}
                    id="edit-staff-first-name"
                    isInvalid={Boolean(errors.firstName)}
                    maxLength={100}
                    onChange={handleTextChange('firstName')}
                    placeholder="Enter first name"
                    type="text"
                    value={values.firstName}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.firstName}
                  </Form.Control.Feedback>
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <FormLabel htmlFor="edit-staff-last-name">
                    Last Name {requiredMark}
                  </FormLabel>
                  <FormControl
                    autoComplete="family-name"
                    disabled={isPending}
                    id="edit-staff-last-name"
                    isInvalid={Boolean(errors.lastName)}
                    maxLength={100}
                    onChange={handleTextChange('lastName')}
                    placeholder="Enter last name"
                    type="text"
                    value={values.lastName}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.lastName}
                  </Form.Control.Feedback>
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <FormLabel htmlFor="edit-staff-email">
                    Email Address {requiredMark}
                  </FormLabel>
                  <FormControl
                    autoComplete="email"
                    disabled={isPending}
                    id="edit-staff-email"
                    isInvalid={Boolean(errors.email)}
                    maxLength={255}
                    onChange={handleTextChange('email')}
                    placeholder="name@clinic.com"
                    type="email"
                    value={values.email}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.email}
                  </Form.Control.Feedback>
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <FormLabel htmlFor="edit-staff-phone">Phone Number</FormLabel>
                  <FormControl
                    autoComplete="tel"
                    disabled={isPending}
                    id="edit-staff-phone"
                    isInvalid={Boolean(errors.phone)}
                    maxLength={30}
                    onChange={handleTextChange('phone')}
                    placeholder="+1 555 0100"
                    type="tel"
                    value={values.phone}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.phone}
                  </Form.Control.Feedback>
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <FormLabel htmlFor="edit-staff-role">
                    Role {requiredMark}
                  </FormLabel>
                  <FormSelect
                    disabled={isPending}
                    id="edit-staff-role"
                    isInvalid={Boolean(errors.role)}
                    onChange={handleRoleChange}
                    value={values.role}
                  >
                    {STAFF_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {staffRoleLabels[role]}
                      </option>
                    ))}
                  </FormSelect>
                  <Form.Control.Feedback type="invalid">
                    {errors.role}
                  </Form.Control.Feedback>
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <FormLabel htmlFor="edit-staff-status">
                    Status {requiredMark}
                  </FormLabel>
                  <FormSelect
                    disabled={isPending}
                    id="edit-staff-status"
                    isInvalid={Boolean(errors.status)}
                    onChange={handleStatusChange}
                    value={values.status}
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {staffStatusLabels[status]}
                      </option>
                    ))}
                  </FormSelect>
                  <Form.Control.Feedback type="invalid">
                    {errors.status}
                  </Form.Control.Feedback>
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <FormLabel htmlFor="edit-staff-specialization">
                    Specialization
                  </FormLabel>
                  <FormControl
                    disabled={isPending}
                    id="edit-staff-specialization"
                    isInvalid={Boolean(errors.specialization)}
                    maxLength={255}
                    onChange={handleTextChange('specialization')}
                    placeholder="e.g. Endodontics"
                    type="text"
                    value={values.specialization}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.specialization}
                  </Form.Control.Feedback>
                </FormGroup>
              </Col>

              <Col md={6}>
                <FormGroup>
                  <FormLabel htmlFor="edit-staff-avatar">Avatar URL</FormLabel>
                  <FormControl
                    disabled={isPending}
                    id="edit-staff-avatar"
                    isInvalid={Boolean(errors.avatar)}
                    maxLength={500}
                    onChange={handleTextChange('avatar')}
                    placeholder="https://example.com/avatar.jpg"
                    type="url"
                    value={values.avatar}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.avatar}
                  </Form.Control.Feedback>
                </FormGroup>
              </Col>
            </Row>
          )}
        </ModalBody>

        <ModalFooter>
          <Button disabled={isPending} onClick={handleClose} variant="light">
            Cancel
          </Button>
          <Button disabled={isPending || !values} type="submit" variant="primary">
            {isPending && (
              <Spinner
                animation="border"
                aria-hidden="true"
                className="me-1"
                size="sm"
              />
            )}
            Save Changes
          </Button>
        </ModalFooter>
      </Form>
    </Modal>
  );
};

export default StaffEditModal;
