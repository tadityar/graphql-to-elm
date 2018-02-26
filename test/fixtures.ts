import { Options, TypeDecoders } from "../src/options";

export interface Fixture {
  id: string;
  dir: string;
  options: Options;
  expect: string;
  throws?: string;
}

export const getFixtures = (fixtureId?: string): Fixture[] =>
  Object.keys(data)
    .map(key => ({
      id: key,
      dir: `fixtures/${key}`,
      ...data[key]
    }))
    .filter(fixture => !fixtureId || fixture.id === fixtureId);

interface Config {
  schema?: string;
  queries: string[];
  scalarDecoders?: TypeDecoders;
  enumDecoders?: TypeDecoders;
  src?: string;
  dest?: string;
  expect?: string;
  throws?: string;
}

interface FinalConfig {
  options: Options;
  expect: string;
  throws?: string;
}

const create = ({
  schema = "schema.gql",
  queries,
  scalarDecoders,
  enumDecoders,
  src,
  dest = "generated-output",
  expect = "expected-output",
  throws
}: Config): FinalConfig => ({
  options: {
    schema,
    queries,
    scalarDecoders,
    enumDecoders,
    src,
    dest
  },
  expect,
  throws
});

const data: { [key: string]: FinalConfig } = {
  keywords: create({ queries: ["query.gql"] }),
  lists: create({ queries: ["list-of-objects.gql", "list-of-scalars.gql"] }),
  misc: create({ queries: ["query.gql"] }),
  objects: create({
    queries: [
      "basic.gql",
      "big.gql",
      "nested.gql",
      "same-type-same-fields.gql",
      "same-type-same-fields-nullable.gql",
      "same-type-same-fields-list.gql",
      "same-type-other-fields.gql",
      "other-type-same-fields.gql",
      "other-type-other-fields.gql"
      // TODO
      // - resursive decoding? (using lazy)
    ]
  }),
  scalars: create({
    queries: ["default-scalar-types.gql", "default-nullable-scalar-types.gql"]
  }),
  customScalars: create({
    queries: ["custom-scalar-types.gql", "custom-nullable-scalar-types.gql"],
    scalarDecoders: {
      ID: {
        type: "Data.Id.Id",
        decoder: "Data.Id.decoder"
      },
      Date: {
        type: "Data.Date.Date",
        decoder: "Data.Date.decoder"
      }
    }
  }),
  enums: create({
    queries: ["enum.gql", "nullable-enum.gql"],
    enumDecoders: {
      Binary: {
        type: "Data.Binary.Binary",
        decoder: "Data.Binary.decoder"
      }
    }
  }),
  variables: create({
    queries: [
      "scalars.gql",
      "scalars-optional.gql",
      "scalars-mixed.gql",
      "inputs.gql",
      "inputs-optional.gql",
      "inputs-mixed.gql",
      "inputs-multiple.gql",
      "lists.gql"
    ]
  }),
  directives: create({
    queries: ["include.gql", "skip.gql", "mixed1.gql", "mixed2.gql"]
  }),
  "inline-fragments": create({
    queries: [
      "union.gql",
      "union-list.gql",
      "union-partial.gql",
      "interface.gql",
      "interface-list.gql",
      "interface-partial.gql",
      "interface-plain.gql"
      // TODO same signature (... auto __typename?)
    ]
  }),
  "inline-fragments-throws": create({
    queries: ["same-signature.gql"],
    throws:
      "multiple union constructors for Animal with the same json signature: color : String"
  })
  // TODO
  // - fragments
  // - operation names
  // - endpoint
  // - swapi
  // - fix generate import using hardcoded names
  //   (add variables encoder & data decoder to intel)
};
