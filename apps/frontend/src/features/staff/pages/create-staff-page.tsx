'use client';

import PageBreadcrumb from '@/components/PageBreadcrumb';
import Icon from '@/components/wrappers/Icon';
import { ApiError } from '@/lib/api';
import { useNotificationStore } from '@/store';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';
import {
  Alert,
  Button,
  Card,
  CardBody,
  Col,
  Form,
  FormControl,
  FormGroup,
  FormLabel,
  FormSelect,
  Row,
  Spinner,
} from 'react-bootstrap';

import { useCreateStaffMember } from '../hooks';
import { STAFF_ROLES, staffRoleLabels, type StaffRole } from '../model';
import {
  createEmptyCreateStaffFormValues,
  mapCreateStaffFormToCommand,
  validateCreateStaffForm,
  type CreateStaffFormErrors,
  type CreateStaffFormField,
  type CreateStaffFormValues,
} from '../schemas';

const requiredMark = <span className="text-danger">*</span>;
const maxAvatarFileSize = 1024 * 1024 * 2;

const getInitialsPreview = (values: CreateStaffFormValues): string => {
  const firstInitial = values.firstName.trim().charAt(0);
  const lastInitial = values.lastName.trim().charAt(0);
  const initials = `${firstInitial}${lastInitial}`.toUpperCase();

  return initials || 'SM';
};

const getFieldErrorFromApiMessage = (
  message: string,
): Partial<Record<CreateStaffFormField, string>> => {
  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes('email')) {
    return { email: message };
  }

  if (normalizedMessage.includes('password')) {
    return { password: message };
  }

  if (normalizedMessage.includes('avatar')) {
    return { avatar: message };
  }

  if (normalizedMessage.includes('phone')) {
    return { phone: message };
  }

  return {};
};

const mapSubmissionError = (error: unknown): CreateStaffFormErrors => {
  if (error instanceof ApiError) {
    if (error.status === 409) {
      return {
        email: 'A staff member with this email already exists.',
      };
    }

    const message =
      error.message ||
      'Unable to create the staff member. Check the form and try again.';
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
        : 'Unable to create the staff member.',
  };
};

const CreateStaffPage = () => {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const clinicId = session?.user.clinicId;
  const { createStaffMember, isPending } = useCreateStaffMember();
  const showNotification = useNotificationStore(
    (state) => state.showNotification,
  );
  const [values, setValues] = useState<CreateStaffFormValues>(
    createEmptyCreateStaffFormValues,
  );
  const [errors, setErrors] = useState<CreateStaffFormErrors>({});
  const [wasSubmitted, setWasSubmitted] = useState(false);
  const [uploadedAvatarPreview, setUploadedAvatarPreview] = useState<
    string | null
  >(null);

  const initialsPreview = useMemo(() => getInitialsPreview(values), [values]);
  const displayName =
    [values.firstName.trim(), values.lastName.trim()]
      .filter(Boolean)
      .join(' ') || 'New staff member';
  const avatarPreview = uploadedAvatarPreview;
  const canSubmit =
    sessionStatus === 'authenticated' && Boolean(clinicId) && !isPending;

  useEffect(() => {
    return () => {
      if (uploadedAvatarPreview) {
        URL.revokeObjectURL(uploadedAvatarPreview);
      }
    };
  }, [uploadedAvatarPreview]);

  const updateField = (
    field: CreateStaffFormField,
    value: CreateStaffFormValues[CreateStaffFormField],
  ) => {
    const nextValues = {
      ...values,
      [field]: value,
    };

    if (field === 'role' && value !== 'DOCTOR') {
      nextValues.specialization = '';
    }

    setValues(nextValues);

    if (wasSubmitted) {
      setErrors(validateCreateStaffForm(nextValues).errors);
    }
  };

  const handleTextChange =
    (field: CreateStaffFormField) => (event: ChangeEvent<HTMLInputElement>) => {
      updateField(field, event.currentTarget.value);
    };

  const handleRoleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    updateField('role', event.currentTarget.value as StaffRole);
  };

  const handleAvatarFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.currentTarget.files?.[0] ?? null;

    if (!selectedFile) {
      setUploadedAvatarPreview(null);
      return;
    }

    if (!selectedFile.type.startsWith('image/')) {
      setErrors((currentErrors) => ({
        ...currentErrors,
        avatar: 'Choose an image file for the staff photo.',
      }));
      return;
    }

    if (selectedFile.size > maxAvatarFileSize) {
      setErrors((currentErrors) => ({
        ...currentErrors,
        avatar: 'Staff photo must be 2 MB or smaller.',
      }));
      return;
    }

    setUploadedAvatarPreview(URL.createObjectURL(selectedFile));
    setErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };
      delete nextErrors.avatar;
      return nextErrors;
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setWasSubmitted(true);

    const validation = validateCreateStaffForm(values);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    if (!clinicId) {
      setErrors({
        form: 'Clinic context is required to create a staff member.',
      });
      return;
    }

    try {
      setErrors({});
      await createStaffMember(mapCreateStaffFormToCommand(clinicId, values));

      showNotification({
        message: 'Staff member created successfully.',
        title: 'Staff member created',
        variant: 'success',
      });
      router.push('/staff');
    } catch (error) {
      const nextErrors = mapSubmissionError(error);
      setErrors(nextErrors);
      showNotification({
        message:
          nextErrors.form ??
          nextErrors.email ??
          'Unable to create the staff member.',
        title: 'Staff request failed',
        variant: 'danger',
      });
    }
  };

  return (
    <>
      <PageBreadcrumb title="Create Staff Member" subtitle="Staff" />

      <Row className="g-3">
        <Col xl={8}>
          <Card>
            <CardBody>
              <Form noValidate onSubmit={handleSubmit}>
                {errors.form && <Alert variant="danger">{errors.form}</Alert>}

                <h5 className="mb-3 text-uppercase bg-light-subtle p-1 border-dashed border rounded border-light d-flex justify-content-center align-items-center gap-1">
                  <Icon icon="circle-user-round" className="fs-lg" />
                  Profile Info
                </h5>

                <Row>
                  <Col md={6}>
                    <FormGroup className="mb-3">
                      <FormLabel htmlFor="staff-first-name">
                        First Name {requiredMark}
                      </FormLabel>
                      <FormControl
                        autoComplete="given-name"
                        disabled={isPending}
                        id="staff-first-name"
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
                    <FormGroup className="mb-3">
                      <FormLabel htmlFor="staff-last-name">
                        Last Name {requiredMark}
                      </FormLabel>
                      <FormControl
                        autoComplete="family-name"
                        disabled={isPending}
                        id="staff-last-name"
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
                </Row>

                <Row>
                  <Col md={6}>
                    <FormGroup className="mb-3">
                      <FormLabel htmlFor="staff-email">
                        Email Address {requiredMark}
                      </FormLabel>
                      <FormControl
                        autoComplete="email"
                        disabled={isPending}
                        id="staff-email"
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
                    <FormGroup className="mb-3">
                      <FormLabel htmlFor="staff-phone">Phone Number</FormLabel>
                      <FormControl
                        autoComplete="tel"
                        disabled={isPending}
                        id="staff-phone"
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
                </Row>

                <Row>
                  <Col md={values.role === 'DOCTOR' ? 6 : 12}>
                    <FormGroup className="mb-3">
                      <FormLabel htmlFor="staff-role">
                        Role {requiredMark}
                      </FormLabel>
                      <FormSelect
                        disabled={isPending}
                        id="staff-role"
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

                  {values.role === 'DOCTOR' && (
                    <Col md={6}>
                      <FormGroup className="mb-3">
                        <FormLabel htmlFor="staff-specialization">
                          Specialization
                        </FormLabel>
                        <FormControl
                          disabled={isPending}
                          id="staff-specialization"
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
                  )}
                </Row>

                <FormGroup className="mb-3">
                  <FormLabel htmlFor="staff-avatar-file">
                    Profile Photo
                  </FormLabel>
                  <FormControl
                    accept="image/*"
                    disabled={isPending}
                    id="staff-avatar-file"
                    onChange={handleAvatarFileChange}
                    type="file"
                  />
                  {errors.avatar && (
                    <div className="invalid-feedback d-block">
                      {errors.avatar}
                    </div>
                  )}
                  <span className="form-text fs-xs fst-italic text-muted">
                    Optional: Upload avatar image
                  </span>
                </FormGroup>

                <h5 className="mb-3 mt-2 text-uppercase bg-light-subtle p-1 border-dashed border rounded border-light d-flex justify-content-center align-items-center gap-1">
                  <Icon icon="shield-user" className="fs-lg" />
                  Login Access
                </h5>

                <Row>
                  <Col md={6}>
                    <FormGroup className="mb-3">
                      <FormLabel htmlFor="staff-password">
                        Password {requiredMark}
                      </FormLabel>
                      <FormControl
                        autoComplete="new-password"
                        disabled={isPending}
                        id="staff-password"
                        isInvalid={Boolean(errors.password)}
                        maxLength={128}
                        onChange={handleTextChange('password')}
                        placeholder="Enter password"
                        type="password"
                        value={values.password}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.password}
                      </Form.Control.Feedback>
                    </FormGroup>
                  </Col>

                  <Col md={6}>
                    <FormGroup className="mb-3">
                      <FormLabel htmlFor="staff-password-confirmation">
                        Confirm Password {requiredMark}
                      </FormLabel>
                      <FormControl
                        autoComplete="new-password"
                        disabled={isPending}
                        id="staff-password-confirmation"
                        isInvalid={Boolean(errors.passwordConfirmation)}
                        maxLength={128}
                        onChange={handleTextChange('passwordConfirmation')}
                        placeholder="Retype password"
                        type="password"
                        value={values.passwordConfirmation}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.passwordConfirmation}
                      </Form.Control.Feedback>
                    </FormGroup>
                  </Col>
                </Row>

                <div className="d-flex flex-wrap justify-content-end gap-2 mt-2">
                  <Link
                    aria-disabled={isPending}
                    className={`btn btn-light${isPending ? ' disabled' : ''}`}
                    href="/staff"
                  >
                    Cancel
                  </Link>
                  <Button disabled={!canSubmit} type="submit" variant="primary">
                    {isPending && (
                      <Spinner
                        animation="border"
                        aria-hidden="true"
                        className="me-1"
                        size="sm"
                      />
                    )}
                    Create Staff Member
                  </Button>
                </div>
              </Form>
            </CardBody>
          </Card>
        </Col>

        <Col xl={4}>
          <Card>
            <CardBody>
              <div className="text-center mb-3">
                <div className="avatar avatar-xxl mx-auto">
                  <span
                    className="avatar-title bg-primary-subtle text-primary rounded-circle fw-bold fs-2 overflow-hidden"
                    style={
                      avatarPreview
                        ? {
                            backgroundImage: `url("${avatarPreview}")`,
                            backgroundPosition: 'center',
                            backgroundSize: 'cover',
                          }
                        : undefined
                    }
                  >
                    {!avatarPreview && initialsPreview}
                  </span>
                </div>
                <h5 className="mb-1 mt-3">{displayName}</h5>
                <span className="badge badge-soft-primary text-primary">
                  {staffRoleLabels[values.role]}
                </span>
                <div className="mt-2">
                  <span className="badge badge-soft-success text-success">
                    Active on creation
                  </span>
                </div>
              </div>

              <div className="border-top border-dashed pt-3">
                <div className="d-flex gap-2 mb-3">
                  <span className="avatar-xs flex-shrink-0">
                    <span className="avatar-title text-bg-light rounded-circle">
                      <Icon icon="mail" />
                    </span>
                  </span>
                  <div className="min-w-0 text-start">
                    <p className="text-muted mb-0">Email</p>
                    <p className="mb-0 text-truncate">
                      {values.email.trim() || 'Not added yet'}
                    </p>
                  </div>
                </div>

                <div className="d-flex gap-2 mb-3">
                  <span className="avatar-xs flex-shrink-0">
                    <span className="avatar-title text-bg-light rounded-circle">
                      <Icon icon="phone" />
                    </span>
                  </span>
                  <div className="min-w-0 text-start">
                    <p className="text-muted mb-0">Phone</p>
                    <p className="mb-0 text-truncate">
                      {values.phone.trim() || 'No phone on file'}
                    </p>
                  </div>
                </div>

                <div className="d-flex gap-2">
                  <span className="avatar-xs flex-shrink-0">
                    <span className="avatar-title text-bg-light rounded-circle">
                      <Icon icon="stethoscope" />
                    </span>
                  </span>
                  <div className="min-w-0 text-start">
                    <p className="text-muted mb-0">Clinical Focus</p>
                    <p className="mb-0 text-truncate">
                      {values.role === 'DOCTOR'
                        ? values.specialization.trim() ||
                          'Specialization pending'
                        : 'General clinic access'}
                    </p>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {sessionStatus === 'loading' && (
            <Alert variant="info">Checking clinic context...</Alert>
          )}

          {sessionStatus === 'authenticated' && !clinicId && (
            <Alert variant="warning">
              This session is missing a clinic context. Staff members cannot be
              created.
            </Alert>
          )}
        </Col>
      </Row>
    </>
  );
};

export default CreateStaffPage;
