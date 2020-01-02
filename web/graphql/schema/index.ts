import { makePrismaSchema, prismaObjectType } from "nexus-prisma";
import { stringArg } from "nexus/dist";
import { prisma } from "../../database/generated/client";
import datamodelInfo from "../../database/generated/nexus-prisma";
const path = require("path");

// @ts-ignore
const User = prismaObjectType({
  name: "User",
  definition(t) {
    t.prismaFields(["name", "id", "avatarUrl", "email"]);
    t.field("posts", {
      type: "Post",
      list: true,
      nullable: true,
      resolve: (user, _, ctx) => {
        return ctx.prisma.posts({
          where: {
            owner: {
              id: user.id,
            },
          },
        });
      },
    });
  },
});

const Query = prismaObjectType({
  name: "Query",
  definition(t) {
    t.field("viewer", {
      type: "User",
      nullable: true,
      resolve: (_, __, ctx) =>
        ctx.viewerId ? ctx.prisma.user({ id: ctx.viewerId }) : null,
    });
  },
});

const Post = prismaObjectType({
  name: "Post",
  definition(t) {
    t.prismaFields(["id", "name", "published", "wysiwygText", "slug"]);
  },
});

const Mutation = prismaObjectType({
  name: "Mutation",
  definition(t) {
    t.field("updatePost", {
      ...t.prismaType.updatePost,
      resolve: async (_, args, ctx) => {
        const posts = await ctx.prisma.posts({
          where: { owner: { id: ctx.viewerId }, id: args.where.id },
        });
        if (!posts.length) {
          throw new Error(
            "Either you do not own this post, or this post could not be found.",
          );
        }
        return t.prismaType.updatePost.resolve(_, args, ctx);
      },
    });
    t.field("createPost", {
      args: {
        name: stringArg({ nullable: false }),
        wysiwygText: stringArg({ nullable: false }),
        slug: stringArg({ nullable: false }),
      },
      type: "Post",
      resolve: async (_, args, ctx) => {
        return ctx.prisma.createPost({
          name: args.name,
          wysiwygText: args.wysiwygText,
          published: false,
          slug: args.slug,
          owner: {
            connect: {
              id: ctx.viewerId,
            },
          },
        });
      },
    });
    t.field("updateViewer", {
      args: {
        name: stringArg(),
        email: stringArg(),
      },
      type: "User",
      resolve: async (_, args, ctx) => {
        return ctx.prisma.updateUser({
          data: {
            ...args,
          },
          where: {
            id: ctx.viewerId,
          },
        });
      },
    });
  },
});

const outputs = process.env.GENERATE
  ? {
      schema: path.join(__dirname, "../schema.generated.graphql"),
      typegen: path.join(__dirname, "../nexus-schema-types.generated.ts"),
    }
  : {
      schema: false,
      typegen: false,
    };

const schema = makePrismaSchema({
  types: [Query, User, Post, Mutation],
  prisma: {
    datamodelInfo,
    client: prisma,
  },
  outputs,
  typegenAutoConfig: {
    sources: [
      {
        source: path.join(__dirname, "../../types/graphql.ts"),
        alias: "types",
      },
    ],
    contextType: "types.Context",
  },
});

export default schema;
