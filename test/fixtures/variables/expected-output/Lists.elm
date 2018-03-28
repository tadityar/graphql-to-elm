module Lists
    exposing
        ( ListsVariables
        , Inputs
        , OtherInputs
        , OptionalInputs
        , ListsQuery
        , lists
        )

import GraphqlToElm.Errors
import GraphqlToElm.Operation
import GraphqlToElm.Optional
import GraphqlToElm.Optional.Encode
import Json.Decode
import Json.Encode


lists : ListsVariables -> GraphqlToElm.Operation.Operation GraphqlToElm.Operation.Query GraphqlToElm.Errors.Errors ListsQuery
lists variables =
    GraphqlToElm.Operation.withQuery
        """query Lists(
$ints: [Int!]
$floats: [Float]
$inputs: [Inputs!]!
$inputs2: [OptionalInputs]!
) {
lists(ints: $ints, floats: $floats, inputs: $inputs, inputs2: $inputs2)
}"""
        (Maybe.Just <| encodeListsVariables variables)
        listsQueryDecoder
        GraphqlToElm.Errors.decoder


type alias ListsVariables =
    { ints : GraphqlToElm.Optional.Optional (List Int)
    , floats : GraphqlToElm.Optional.Optional (List (GraphqlToElm.Optional.Optional Float))
    , inputs : List Inputs
    , inputs2 : List (GraphqlToElm.Optional.Optional OptionalInputs)
    }


encodeListsVariables : ListsVariables -> Json.Encode.Value
encodeListsVariables inputs =
    GraphqlToElm.Optional.Encode.object
        [ ( "ints", (GraphqlToElm.Optional.map (List.map Json.Encode.int >> Json.Encode.list)) inputs.ints )
        , ( "floats", (GraphqlToElm.Optional.map (GraphqlToElm.Optional.Encode.list Json.Encode.float)) inputs.floats )
        , ( "inputs", ((List.map encodeInputs >> Json.Encode.list) >> GraphqlToElm.Optional.Present) inputs.inputs )
        , ( "inputs2", ((GraphqlToElm.Optional.Encode.list encodeOptionalInputs) >> GraphqlToElm.Optional.Present) inputs.inputs2 )
        ]


type alias Inputs =
    { int : Int
    , float : Float
    , other : OtherInputs
    }


encodeInputs : Inputs -> Json.Encode.Value
encodeInputs inputs =
    Json.Encode.object
        [ ( "int", Json.Encode.int inputs.int )
        , ( "float", Json.Encode.float inputs.float )
        , ( "other", encodeOtherInputs inputs.other )
        ]


type alias OtherInputs =
    { string : String
    }


encodeOtherInputs : OtherInputs -> Json.Encode.Value
encodeOtherInputs inputs =
    Json.Encode.object
        [ ( "string", Json.Encode.string inputs.string )
        ]


type alias OptionalInputs =
    { int : GraphqlToElm.Optional.Optional Int
    , float : GraphqlToElm.Optional.Optional Float
    , other : GraphqlToElm.Optional.Optional OtherInputs
    }


encodeOptionalInputs : OptionalInputs -> Json.Encode.Value
encodeOptionalInputs inputs =
    GraphqlToElm.Optional.Encode.object
        [ ( "int", (GraphqlToElm.Optional.map Json.Encode.int) inputs.int )
        , ( "float", (GraphqlToElm.Optional.map Json.Encode.float) inputs.float )
        , ( "other", (GraphqlToElm.Optional.map encodeOtherInputs) inputs.other )
        ]


type alias ListsQuery =
    { lists : Maybe.Maybe String
    }


listsQueryDecoder : Json.Decode.Decoder ListsQuery
listsQueryDecoder =
    Json.Decode.map ListsQuery
        (Json.Decode.field "lists" (Json.Decode.nullable Json.Decode.string))
