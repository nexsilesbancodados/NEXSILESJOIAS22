import { useState, useCallback } from 'react';
import { z } from 'zod';

type ValidationErrors<T> = Partial<Record<keyof T, string>>;
type TouchedFields<T> = Partial<Record<keyof T, boolean>>;

interface UseFormValidationOptions<T> {
  schema: z.ZodSchema<T>;
  initialValues: T;
}

interface UseFormValidationReturn<T> {
  values: T;
  errors: ValidationErrors<T>;
  touched: TouchedFields<T>;
  isValid: boolean;
  setValue: (field: keyof T, value: any) => void;
  setTouched: (field: keyof T) => void;
  validateField: (field: keyof T) => boolean;
  validateAll: () => boolean;
  reset: (newValues?: T) => void;
  getFieldProps: (field: keyof T) => {
    value: any;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onBlur: () => void;
    error: string | undefined;
    touched: boolean;
  };
}

export function useFormValidation<T extends Record<string, any>>({
  schema,
  initialValues,
}: UseFormValidationOptions<T>): UseFormValidationReturn<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<ValidationErrors<T>>({});
  const [touched, setTouchedState] = useState<TouchedFields<T>>({});

  const validateField = useCallback((field: keyof T): boolean => {
    try {
      // Create a partial schema for single field validation
      const result = schema.safeParse(values);
      
      if (result.success) {
        setErrors(prev => ({ ...prev, [field]: undefined }));
        return true;
      }
      
      const fieldError = result.error.errors.find(e => e.path[0] === field);
      setErrors(prev => ({ 
        ...prev, 
        [field]: fieldError?.message 
      }));
      
      return !fieldError;
    } catch {
      return false;
    }
  }, [schema, values]);

  const validateAll = useCallback((): boolean => {
    const result = schema.safeParse(values);
    
    if (result.success) {
      setErrors({});
      return true;
    }

    const newErrors: ValidationErrors<T> = {};
    const newTouched: TouchedFields<T> = {};
    
    result.error.errors.forEach(err => {
      const field = err.path[0] as keyof T;
      if (!newErrors[field]) {
        newErrors[field] = err.message;
      }
      newTouched[field] = true;
    });

    setErrors(newErrors);
    setTouchedState(prev => ({ ...prev, ...newTouched }));
    
    return false;
  }, [schema, values]);

  const setValue = useCallback((field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  const setTouched = useCallback((field: keyof T) => {
    setTouchedState(prev => ({ ...prev, [field]: true }));
    validateField(field);
  }, [validateField]);

  const reset = useCallback((newValues?: T) => {
    setValues(newValues || initialValues);
    setErrors({});
    setTouchedState({});
  }, [initialValues]);

  const getFieldProps = useCallback((field: keyof T) => ({
    value: values[field] ?? '',
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setValue(field, e.target.value),
    onBlur: () => setTouched(field),
    error: errors[field],
    touched: touched[field] || false,
  }), [values, errors, touched, setValue, setTouched]);

  const isValid = Object.keys(errors).length === 0 || 
    Object.values(errors).every(e => e === undefined);

  return {
    values,
    errors,
    touched,
    isValid,
    setValue,
    setTouched,
    validateField,
    validateAll,
    reset,
    getFieldProps,
  };
}
