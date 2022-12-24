import { JsonSerializable, registerSerializer as registerSerializerImpl, SerializerImplementation } from "threads";

export interface SingleSerializable {
  [key: string]: JsonSerializable;
}

export interface TypedSerializer<Msg extends SingleSerializable, Input> {
  readonly type: string;
  canSerialize(input: unknown): input is Input;
  deserialize(message: Msg): Input;
  serialize(input: Input): Msg;
}

export function registerSerializer<Msg extends SingleSerializable, Input>(serializer: TypedSerializer<Msg, Input>) {
  const serializerImplementation: SerializerImplementation = {
    deserialize: function (message: JsonSerializable, defaultDeserialize: (msg: JsonSerializable) => unknown) {
      if (canDeserialize(message, serializer)) {
        return Array.isArray(message.payload)
          ? message.payload.map((e) => serializer.deserialize(e))
          : serializer.deserialize(message.payload);
      }
      return defaultDeserialize(message);
    },
    serialize: function (input: unknown, defaultSerialize: (inp: unknown) => JsonSerializable) {
      if (Array.isArray(input) && input.every((e) => serializer.canSerialize(e))) {
        return {
          __type: `$$${serializer.type}[]`,
          payload: input.map((e) => serializer.serialize(e as Input)),
        };
      }
      if (serializer.canSerialize(input)) {
        return {
          __type: `$$${serializer.type}`,
          payload: serializer.serialize(input),
        };
      }
      return defaultSerialize(input);
    },
  };
  return registerSerializerImpl(serializerImplementation);
}

function canDeserialize<Msg extends SingleSerializable>(
  message: JsonSerializable,
  serializer: TypedSerializer<Msg, unknown>
): message is { payload: Msg | Msg[] } {
  return (
    !!message &&
    typeof message === "object" &&
    "__type" in message &&
    "payload" in message &&
    (message.__type == `$$${serializer.type}` || message.__type == `$$${serializer.type}[]`)
  );
}
