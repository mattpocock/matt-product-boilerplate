import {
  FieldInputProps,
  FormikConsumer,
  FormikProvider,
  useField,
  useFormik,
} from "formik";
import React, { useMemo } from "react";

interface UseMutationFormParams<V extends {}, T extends {}> {
  initialValues: Partial<V>;
  config: FormConfig<V, T>;
  onSubmit: (values: V) => Promise<any>;
}

interface MakeUseMutationFormParams<T extends {}> {
  inputs: T;
}

type FormConfig<V, T> = {
  [K in keyof V]: {
    type: keyof T;
    label?: string;
    nullable?: boolean;
  };
};

type FormInputFC = React.FC<Partial<FieldInputProps<any> & { label: string }>>;

export function makeUseMutationForm<T extends { [K in keyof T]: FormInputFC }>({
  inputs,
}: MakeUseMutationFormParams<T>) {
  return function useMutationForm<V extends {}>({
    initialValues,
    onSubmit,
    config,
  }: UseMutationFormParams<V, T>) {
    const Wrapper: React.FC = ({ children }) => {
      const formik = useFormik<V>({
        initialValues: initialValues as any,
        onSubmit: async (values) => {
          await onSubmit(values);
        },
        validate: (values) => {
          const keys = Object.keys(config);
          for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            if (!(config as any)[key].nullable && !(values as any)[key]) {
              return {
                [key]: "This field is required.",
              };
            }
          }
        },
      });
      return (
        <FormikProvider value={formik}>
          <form onSubmit={formik.handleSubmit}>{children}</form>
        </FormikProvider>
      );
    };

    const SubmitButton: React.FC = ({ children }) => (
      <FormikConsumer>
        {({ isSubmitting }) => (
          <button type="submit" disabled={isSubmitting}>
            {children || "Submit"}
          </button>
        )}
      </FormikConsumer>
    );

    const Inputs: {
      [K in keyof Required<V>]: T[FormConfig<Required<V>, T>[K]["type"]];
    } = useMemo(
      () =>
        Object.keys(config).reduce(
          (obj, key) => {
            return {
              ...obj,
              [key]: (props: any) => {
                const type: keyof T = (config as any)[key].type;
                const Comp = inputs[type];
                /* eslint-disable-next-line */
                const [inputProps] = useField(key);
                return (
                  <Comp
                    {...inputProps}
                    {...props}
                    label={(config as any)[key].label}
                  />
                );
              },
            };
          },
          {} as any,
        ),
      [config],
    );

    return {
      Wrapper,
      SubmitButton,
      Inputs,
    };
  };
}
