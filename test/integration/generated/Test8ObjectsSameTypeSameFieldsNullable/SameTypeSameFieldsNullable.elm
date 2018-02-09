module Generated.Test8ObjectsSameTypeSameFieldsNullable.SameTypeSameFieldsNullable exposing (Data, Person2, decoder, query)

import Json.Decode


query : String
query =
    """{
  you {
    email
  }
  youOrNull {
    email
  }
}"""


type alias Person2 =
    { email : Maybe String
    }


person2Decoder : Json.Decode.Decoder Person2
person2Decoder =
    Json.Decode.map Person2
        (Json.Decode.field "email" (Json.Decode.nullable Json.Decode.string))


type alias Data =
    { you : Person2
    , youOrNull : Maybe Person2
    }


decoder : Json.Decode.Decoder Data
decoder =
    Json.Decode.map2 Data
        (Json.Decode.field "you" person2Decoder)
        (Json.Decode.field "youOrNull" (Json.Decode.nullable person2Decoder))
