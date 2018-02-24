module Union
    exposing
        ( Data
        , FlipUnion(..)
        , Heads
        , Tails
        , query
        , decoder
        )

import Json.Decode


query : String
query =
    """query Union {
  flip {
    ... on Heads {
      name
    }
    ... on Tails {
      length
    }
  }
}"""


type alias Data =
    { flip : FlipUnion
    }


decoder : Json.Decode.Decoder Data
decoder =
    Json.Decode.map Data
        (Json.Decode.field "flip" flipUnionDecoder)


type FlipUnion
    = OnHeads Heads
    | OnTails Tails


flipUnionDecoder : Json.Decode.Decoder FlipUnion
flipUnionDecoder =
    Json.Decode.oneOf
        [ Json.Decode.map OnHeads headsDecoder
        , Json.Decode.map OnTails tailsDecoder
        ]


type alias Heads =
    { name : String
    }


headsDecoder : Json.Decode.Decoder Heads
headsDecoder =
    Json.Decode.map Heads
        (Json.Decode.field "name" Json.Decode.string)


type alias Tails =
    { length : Float
    }


tailsDecoder : Json.Decode.Decoder Tails
tailsDecoder =
    Json.Decode.map Tails
        (Json.Decode.field "length" Json.Decode.float)