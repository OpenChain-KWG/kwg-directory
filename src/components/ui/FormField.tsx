'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'

import { ErrorMessage } from './ErrorMessage'
import { HelperText } from './HelperText'
import { Label } from './Label'

interface FormFieldContextValue {
  id: string
  helperId: string
  errorId: string
  hasError: boolean
}

const FormFieldContext = React.createContext<FormFieldContextValue | null>(null)

function useFormField() {
  const ctx = React.useContext(FormFieldContext)
  if (!ctx) {
    throw new Error('FormField subcomponent must be used inside <FormField>')
  }
  return ctx
}

export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Stable id for the control. If omitted, an auto id is generated. */
  id?: string
  /** Whether the field currently has an error. Wires aria-* automatically. */
  hasError?: boolean
}

/**
 * FormField — compound layout component that wires Label, control,
 * HelperText, and ErrorMessage together with consistent spacing and aria-*
 * relationships.
 *
 * Use via subcomponents:
 *   <FormField id="email" hasError={!!errors.email}>
 *     <FormField.Label>Email</FormField.Label>
 *     <FormField.Control>
 *       <Input type="email" />
 *     </FormField.Control>
 *     <FormField.Helper>We never share your email.</FormField.Helper>
 *     <FormField.Error>{errors.email}</FormField.Error>
 *   </FormField>
 */
const FormFieldRoot = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ className, id, hasError = false, children, ...props }, ref) => {
    const generatedId = React.useId()
    const fieldId = id ?? generatedId
    const ctx = React.useMemo<FormFieldContextValue>(
      () => ({
        id: fieldId,
        helperId: `${fieldId}-helper`,
        errorId: `${fieldId}-error`,
        hasError,
      }),
      [fieldId, hasError],
    )
    return (
      <FormFieldContext.Provider value={ctx}>
        <div
          ref={ref}
          className={cn('flex flex-col gap-1.5', className)}
          {...props}
        >
          {children}
        </div>
      </FormFieldContext.Provider>
    )
  },
)
FormFieldRoot.displayName = 'FormField'

const FormFieldLabel = React.forwardRef<
  React.ElementRef<typeof Label>,
  React.ComponentPropsWithoutRef<typeof Label>
>(({ ...props }, ref) => {
  const { id } = useFormField()
  return <Label ref={ref} htmlFor={id} {...props} />
})
FormFieldLabel.displayName = 'FormField.Label'

export interface FormFieldControlProps {
  /** Single child input/textarea/select that receives field id + aria-*. */
  children: React.ReactElement<{
    id?: string
    'aria-describedby'?: string
    'aria-invalid'?: boolean
  }>
}

/**
 * Wires the field id and aria-describedby to the single child control.
 * Use a single React element child (Input, Textarea, Select, etc).
 */
const FormFieldControl = ({ children }: FormFieldControlProps) => {
  const { id, helperId, errorId, hasError } = useFormField()
  const child = React.Children.only(children)
  const describedBy = [
    child.props['aria-describedby'],
    helperId,
    hasError ? errorId : null,
  ]
    .filter(Boolean)
    .join(' ') || undefined
  return React.cloneElement(child, {
    id: child.props.id ?? id,
    'aria-describedby': describedBy,
    'aria-invalid': hasError ? true : child.props['aria-invalid'],
  })
}
FormFieldControl.displayName = 'FormField.Control'

const FormFieldHelper = React.forwardRef<
  HTMLParagraphElement,
  React.ComponentPropsWithoutRef<typeof HelperText>
>(({ ...props }, ref) => {
  const { helperId } = useFormField()
  return <HelperText ref={ref} id={helperId} {...props} />
})
FormFieldHelper.displayName = 'FormField.Helper'

const FormFieldError = React.forwardRef<
  HTMLParagraphElement,
  React.ComponentPropsWithoutRef<typeof ErrorMessage>
>(({ ...props }, ref) => {
  const { errorId, hasError } = useFormField()
  if (!hasError) return null
  return <ErrorMessage ref={ref} id={errorId} {...props} />
})
FormFieldError.displayName = 'FormField.Error'

type FormFieldType = typeof FormFieldRoot & {
  Label: typeof FormFieldLabel
  Control: typeof FormFieldControl
  Helper: typeof FormFieldHelper
  Error: typeof FormFieldError
}

const FormField = FormFieldRoot as FormFieldType
FormField.Label = FormFieldLabel
FormField.Control = FormFieldControl
FormField.Helper = FormFieldHelper
FormField.Error = FormFieldError

export {
  FormField,
  FormFieldLabel,
  FormFieldControl,
  FormFieldHelper,
  FormFieldError,
}
