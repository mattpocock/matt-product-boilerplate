import { PrimaryButton } from "@nice-boys/components";
import React from "react";
import { Box, Flex } from "rebass";
import Heading from "../components/Heading";
import {
  CreatePostMutationVariables,
  useCreatePostMutation,
} from "../graphql/mutations/createPost.generated";
import {
  useGetViewerQuery,
  GetViewerDocument,
  GetViewerQueryResult,
} from "../graphql/queries/getViewer.generated";
import { makeUseMutationForm } from "../utils/makeUseMutationForm";
import { Post } from "../database/generated/client";
import {
  useUpdatePostMutation,
  UpdatePostMutationVariables,
} from "../graphql/mutations/updatePost.generated";

const useMutationForm = makeUseMutationForm({
  inputs: {
    text: ({ name, onChange, onBlur, value, label }) => (
      <>
        {label && <label htmlFor={name}>{label}</label>}
        <input
          name={name}
          type="text"
          onChange={onChange}
          onBlur={onBlur}
          value={value}
        ></input>
      </>
    ),
    checkbox: ({ name, onChange, onBlur, value, label }) => (
      <>
        {label && <label htmlFor={name}>{label}</label>}
        <input
          type="checkbox"
          name={name}
          onChange={() => {
            if (onChange) {
              onChange({ target: { name, value: !value } });
            }
          }}
          onBlur={onBlur}
          checked={Boolean(value)}
        ></input>
      </>
    ),
    textarea: ({ name, onChange, onBlur, value, label }) => (
      <>
        {label && <label htmlFor={name}>{label}</label>}
        <textarea
          name={name}
          onChange={onChange}
          onBlur={onBlur}
          value={value}
        ></textarea>
      </>
    ),
    hidden: () => null,
  },
});

export default () => {
  const { data, loading, error, refetch } = useGetViewerQuery();
  const [send, { client }] = useCreatePostMutation();
  const CreateForm = useMutationForm<CreatePostMutationVariables>({
    initialValues: {},
    config: {
      name: {
        type: "text",
        label: "Name",
      },
      slug: {
        type: "text",
        label: "Slug",
      },
      wysiwygText: {
        label: "Text",
        type: "textarea",
      },
    },
    onSubmit: (values) =>
      send({ variables: values }).then((result) => {
        // @ts-ignore
        const user: GetViewerQueryResult = client.readQuery(GetViewerDocument);
        // @ts-ignore
        client.writeQuery({
          query: GetViewerDocument,
          data: {
            ...user,
          },
        });
      }),
  });
  if (data) {
    return (
      <Flex alignItems="center" justifyContent="center" mt={4}>
        {data.viewer && data.viewer.name ? (
          <Flex flexDirection="column" alignItems="center">
            <Heading>
              👋 Hello, {data.viewer ? data.viewer.name : "anonymous"}!
            </Heading>
            <Box mt={2}>
              <a href="/api/auth/logout">
                <PrimaryButton>Log out</PrimaryButton>
              </a>
            </Box>
            {(data.viewer.posts || []).map((post) => (
              <UpdatePost post={post} refetch={refetch} />
            ))}
            <Box mt={2}>
              <CreateForm.Wrapper>
                <CreateForm.Inputs.name></CreateForm.Inputs.name>
                <CreateForm.Inputs.slug></CreateForm.Inputs.slug>
                <CreateForm.Inputs.wysiwygText></CreateForm.Inputs.wysiwygText>
                <CreateForm.SubmitButton></CreateForm.SubmitButton>
              </CreateForm.Wrapper>
            </Box>
          </Flex>
        ) : (
          <Box>
            Please <a href="/api/auth/google">log in</a>.
          </Box>
        )}
      </Flex>
    );
  }

  if (loading) return <p>Loading...</p>;

  if (error) return <p>Error :(</p>;

  return null;
};

const UpdatePost = ({ post, refetch }: { refetch: () => void; post: Post }) => {
  const [send] = useUpdatePostMutation();
  const UpdateForm = useMutationForm<UpdatePostMutationVariables>({
    config: {
      id: {
        type: "hidden",
      },
      name: {
        type: "text",
        label: "Name",
      },
      wysiwygText: {
        type: "textarea",
        label: "Text",
      },
      published: {
        type: "checkbox",
        nullable: true,
        label: "Published",
      },
      slug: {
        type: "text",
        label: "Slug",
      },
    },
    initialValues: post,
    onSubmit: (values) => send({ variables: values }).then(refetch),
  });
  return (
    <Box>
      <UpdateForm.Wrapper>
        <UpdateForm.Inputs.name></UpdateForm.Inputs.name>
        <UpdateForm.Inputs.wysiwygText></UpdateForm.Inputs.wysiwygText>
        <UpdateForm.Inputs.published></UpdateForm.Inputs.published>
        <UpdateForm.Inputs.slug></UpdateForm.Inputs.slug>
        <UpdateForm.SubmitButton></UpdateForm.SubmitButton>
      </UpdateForm.Wrapper>
    </Box>
  );
};
