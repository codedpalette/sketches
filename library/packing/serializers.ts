import { JsonSerializable, SerializerImplementation } from "threads";
import { CompoundPath, Rectangle } from "../paper";
import { PackingParams, RandomizationParams } from "./worker";

const PackingParamsType = "$$PackingParams";
const CompoundPathType = "$$CompoundPath";
const CompoundPathArrayType = "$$CompoundPath[]";

type SerializedPackingParams = {
  __type: typeof PackingParamsType;
  nShapes: number;
  boundingRect: {
    point: [number, number];
    size: [number, number];
  };
  blacklistPathData?: string;
  randomizeParams?: RandomizationParams;
};

type SerializedCompoundPath = {
  __type: typeof CompoundPathType;
  pathData: string;
};

type SerializedCompoundPathArray = {
  __type: typeof CompoundPathArrayType;
  paths: SerializedCompoundPath[];
};

function isSerializedPackingParams(serialized: JsonSerializable): serialized is SerializedPackingParams {
  return (serialized as SerializedPackingParams).__type === PackingParamsType;
}

function isSerializedCompoundPath(serialized: JsonSerializable): serialized is SerializedCompoundPath {
  return (serialized as SerializedCompoundPath).__type === CompoundPathType;
}

function isSerializedCompoundPathArray(serialized: JsonSerializable): serialized is SerializedCompoundPathArray {
  return (serialized as SerializedCompoundPathArray).__type === CompoundPathArrayType;
}

function isPackingParams(input: unknown): input is PackingParams {
  const packingParams = input as PackingParams;
  return (
    packingParams.boundingRect &&
    packingParams.boundingRect instanceof Rectangle &&
    typeof packingParams.nShapes === "number" &&
    !!packingParams.nShapes
  );
}

export const CompoundPathSerializer: SerializerImplementation = {
  deserialize: function (message: JsonSerializable, defaultDeserialize: (msg: JsonSerializable) => unknown) {
    if (isSerializedCompoundPathArray(message)) {
      return message.paths.map((path) => this.deserialize(path, defaultDeserialize) as CompoundPath);
    }
    if (isSerializedCompoundPath(message)) {
      return new CompoundPath({ insert: false, pathData: message.pathData });
    }
    return defaultDeserialize(message);
  },
  serialize: function (input: unknown, defaultSerialize: (inp: unknown) => JsonSerializable): JsonSerializable {
    if (input instanceof Array && input[0] instanceof CompoundPath) {
      return {
        __type: CompoundPathArrayType,
        paths: input.map((path) => this.serialize(path, defaultSerialize) as SerializedCompoundPath),
      };
    }
    if (input instanceof CompoundPath) {
      return {
        __type: CompoundPathType,
        pathData: input.pathData,
      };
    }
    return defaultSerialize(input);
  },
};

export const PackingParamsSerializer: SerializerImplementation = {
  deserialize: function (message: JsonSerializable, defaultDeserialize: (msg: JsonSerializable) => unknown) {
    if (isSerializedPackingParams(message)) {
      return {
        nShapes: message.nShapes,
        boundingRect: new Rectangle({ point: message.boundingRect.point, size: message.boundingRect.size }),
        blacklistShape: message.blacklistPathData && new CompoundPath(message.blacklistPathData),
        randomizeParams: message.randomizeParams,
      } as PackingParams;
    }
    return defaultDeserialize(message);
  },
  serialize: function (input: unknown, defaultSerialize: (inp: unknown) => JsonSerializable) {
    if (isPackingParams(input)) {
      const serializedPackingParams = {
        __type: PackingParamsType,
        nShapes: input.nShapes,
        boundingRect: {
          point: [input.boundingRect.point.x, input.boundingRect.point.y],
          size: [input.boundingRect.size.width, input.boundingRect.size.height],
        },
        blacklistPathData: input.blacklistShape?.pathData,
        randomizeParams: input.randomizeParams,
      } as SerializedPackingParams;
      return serializedPackingParams;
    }
    return defaultSerialize(input);
  },
};
