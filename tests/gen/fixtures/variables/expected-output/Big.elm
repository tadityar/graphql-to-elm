module Big exposing
    ( BigInput
    , BigQuery
    , BigResponse
    , BigVariables
    , big
    , bigInputDecoder
    , bigVariablesDecoder
    , encodeBigInput
    , encodeBigVariables
    )

import GraphQL.Errors
import GraphQL.Helpers.Decode
import GraphQL.Operation
import GraphQL.Optional
import GraphQL.Response
import Json.Decode
import Json.Encode


big : BigVariables -> GraphQL.Operation.Operation GraphQL.Operation.Query GraphQL.Errors.Errors BigQuery
big variables =
    GraphQL.Operation.withQuery
        """query Big($inputs: BigInput) {
big(inputs: $inputs)
}"""
        (Maybe.Just <| encodeBigVariables variables)
        bigQueryDecoder
        GraphQL.Errors.decoder


type alias BigResponse =
    GraphQL.Response.Response GraphQL.Errors.Errors BigQuery


type alias BigVariables =
    { inputs : GraphQL.Optional.Optional BigInput
    }


encodeBigVariables : BigVariables -> Json.Encode.Value
encodeBigVariables inputs =
    GraphQL.Optional.encodeObject
        [ ( "inputs", GraphQL.Optional.map encodeBigInput inputs.inputs )
        ]


type alias BigInput =
    { field1 : Int
    , field2 : Int
    , field3 : Int
    , field4 : Int
    , field5 : Int
    , field6 : Int
    , field7 : Int
    , field8 : Int
    , field9 : Int
    , field10 : Int
    , field11 : Int
    , field12 : Int
    }


encodeBigInput : BigInput -> Json.Encode.Value
encodeBigInput inputs =
    Json.Encode.object
        [ ( "field1", Json.Encode.int inputs.field1 )
        , ( "field2", Json.Encode.int inputs.field2 )
        , ( "field3", Json.Encode.int inputs.field3 )
        , ( "field4", Json.Encode.int inputs.field4 )
        , ( "field5", Json.Encode.int inputs.field5 )
        , ( "field6", Json.Encode.int inputs.field6 )
        , ( "field7", Json.Encode.int inputs.field7 )
        , ( "field8", Json.Encode.int inputs.field8 )
        , ( "field9", Json.Encode.int inputs.field9 )
        , ( "field10", Json.Encode.int inputs.field10 )
        , ( "field11", Json.Encode.int inputs.field11 )
        , ( "field12", Json.Encode.int inputs.field12 )
        ]


bigVariablesDecoder : Json.Decode.Decoder BigVariables
bigVariablesDecoder =
    Json.Decode.map BigVariables
        (GraphQL.Optional.fieldDecoder "inputs" bigInputDecoder)


bigInputDecoder : Json.Decode.Decoder BigInput
bigInputDecoder =
    Json.Decode.map8 BigInput
        (Json.Decode.field "field1" Json.Decode.int)
        (Json.Decode.field "field2" Json.Decode.int)
        (Json.Decode.field "field3" Json.Decode.int)
        (Json.Decode.field "field4" Json.Decode.int)
        (Json.Decode.field "field5" Json.Decode.int)
        (Json.Decode.field "field6" Json.Decode.int)
        (Json.Decode.field "field7" Json.Decode.int)
        (Json.Decode.field "field8" Json.Decode.int)
        |> GraphQL.Helpers.Decode.andMap (Json.Decode.field "field9" Json.Decode.int)
        |> GraphQL.Helpers.Decode.andMap (Json.Decode.field "field10" Json.Decode.int)
        |> GraphQL.Helpers.Decode.andMap (Json.Decode.field "field11" Json.Decode.int)
        |> GraphQL.Helpers.Decode.andMap (Json.Decode.field "field12" Json.Decode.int)


type alias BigQuery =
    { big : Maybe.Maybe String
    }


bigQueryDecoder : Json.Decode.Decoder BigQuery
bigQueryDecoder =
    Json.Decode.map BigQuery
        (Json.Decode.field "big" (Json.Decode.nullable Json.Decode.string))
