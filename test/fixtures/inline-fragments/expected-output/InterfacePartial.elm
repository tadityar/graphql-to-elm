module InterfacePartial
    exposing
        ( Data
        , Animal(..)
        , Dog
        , post
        , query
        , decoder
        )

import GraphqlToElm.DecodeHelpers
import GraphqlToElm.Http
import Json.Decode
import Json.Encode


post : String -> GraphqlToElm.Http.Request Data
post url =
    GraphqlToElm.Http.post
        url
        { query = query
        , variables = Json.Encode.null
        }
        decoder


query : String
query =
    """query InterfacePartial {
  animal {
    ... on Dog {
      color
      hairy
    }
  }
}"""


type alias Data =
    { animal : Animal
    }


decoder : Json.Decode.Decoder Data
decoder =
    Json.Decode.map Data
        (Json.Decode.field "animal" animalDecoder)


type Animal
    = OnDog Dog
    | OnOtherAnimal


animalDecoder : Json.Decode.Decoder Animal
animalDecoder =
    Json.Decode.oneOf
        [ Json.Decode.map OnDog dogDecoder
        , GraphqlToElm.DecodeHelpers.emptyObjectDecoder OnOtherAnimal
        ]


type alias Dog =
    { color : String
    , hairy : Bool
    }


dogDecoder : Json.Decode.Decoder Dog
dogDecoder =
    Json.Decode.map2 Dog
        (Json.Decode.field "color" Json.Decode.string)
        (Json.Decode.field "hairy" Json.Decode.bool)
