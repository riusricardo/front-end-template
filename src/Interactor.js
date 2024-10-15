import React, { useEffect, useState } from 'react'
import { Grid, Form, Dropdown, Input, Label } from 'semantic-ui-react'

import { useSubstrateState } from './substrate-lib'
import { TxButton, TxGroupButton } from './substrate-lib/components'

const argIsOptional = arg => arg.type.toString().startsWith('Option<')

function Main(props) {
  const { api, jsonrpc } = useSubstrateState()
  const [status, setStatus] = useState(null)

  const [interxType, setInterxType] = useState('EXTRINSIC')
  const [palletRPCs, setPalletRPCs] = useState([])
  const [callables, setCallables] = useState([])
  const [paramFields, setParamFields] = useState([])

  const initFormState = {
    palletRpc: '',
    callable: '',
    inputParams: [],
  }

  const [formState, setFormState] = useState(initFormState)
  const { palletRpc, callable, inputParams } = formState

  const getApiType = (api, interxType) => {
    if (interxType === 'QUERY') {
      return api.query
    } else if (interxType === 'EXTRINSIC') {
      return api.tx
    } else if (interxType === 'RPC') {
      return api.rpc
    } else {
      return api.consts
    }
  }

  const updatePalletRPCs = () => {
    if (!api) {
      return
    }
    const apiType = getApiType(api, interxType)
    const palletRPCs = Object.keys(apiType)
      .sort()
      .filter(pr => Object.keys(apiType[pr]).length > 0)
      .map(pr => ({ key: pr, value: pr, text: pr }))
    setPalletRPCs(palletRPCs)
  }

  const updateCallables = () => {
    if (!api || palletRpc === '') {
      return
    }
    const callables = Object.keys(getApiType(api, interxType)[palletRpc])
      .sort()
      .map(c => ({ key: c, value: c, text: c }))
    setCallables(callables)
  }

  const updateParamFields = () => {
    if (!api || palletRpc === '' || callable === '') {
      setParamFields([])
      return
    }

    let paramFields = []

    if (interxType === 'QUERY') {
      const metaType = api.query[palletRpc][callable].meta.type
      if (metaType.isPlain) {
        // Do nothing as `paramFields` is already set to []
      } else if (metaType.isMap) {
        paramFields = Object.keys(metaType.asMap['hashers']).map((key) => {
          return {
            name: key.toString(),
            type: metaType.asMap['hashers'][key].toString(),
            optional: false
          };
        }).filter(item => !isNaN(parseInt(item.name)));
      }
    } else if (interxType === 'EXTRINSIC') {
      const metaArgs = api.tx[palletRpc][callable].meta.args

      if (metaArgs && metaArgs.length > 0) {
        paramFields = metaArgs.map(arg => ({
          name: arg.name.toString(),
          type: arg.type.toString(),
          optional: argIsOptional(arg),
        }))
      }
    } else if (interxType === 'RPC') {
      let metaParam = []

      if (jsonrpc[palletRpc] && jsonrpc[palletRpc][callable]) {
        metaParam = jsonrpc[palletRpc][callable].params
      }

      if (metaParam.length > 0) {
        paramFields = metaParam.map(arg => ({
          name: arg.name,
          type: arg.type,
          optional: arg.isOptional || false,
        }))
      }
    } else if (interxType === 'CONSTANT') {
      paramFields = []
    }

    setParamFields(paramFields)
  }

  useEffect(updatePalletRPCs, [api, interxType])
  useEffect(updateCallables, [api, interxType, palletRpc])
  useEffect(updateParamFields, [api, interxType, palletRpc, callable, jsonrpc])

  const onPalletCallableParamChange = (_, data) => {
    setFormState(formState => {
      let res
      const { state, value } = data
      if (typeof state === 'object') {
        // Input parameter updated
        const {
          ind,
          paramField: { type },
        } = state
        const inputParams = [...formState.inputParams]
        inputParams[ind] = { type, value }
        res = { ...formState, inputParams }
      } else if (state === 'palletRpc') {
        res = { ...formState, [state]: value, callable: '', inputParams: [] }
      } else if (state === 'callable') {
        res = { ...formState, [state]: value, inputParams: [] }
      }
      return res
    })
  }

  const onInterxTypeChange = (ev, data) => {
    setInterxType(data.value)
    // clear the formState
    setFormState(initFormState)
  }

  const getOptionalMsg = interxType =>
    interxType === 'RPC'
      ? 'Optional Parameter'
      : 'Leaving this field as blank will submit a NONE value'

  return (
    <Grid.Column width={8}>
      <h1>Pallet Interactor</h1>
      <Form>
        <Form.Group style={{ overflowX: 'auto' }} inline>
          <label>Interaction Type</label>
          <Form.Radio
            label="Extrinsic"
            name="interxType"
            value="EXTRINSIC"
            checked={interxType === 'EXTRINSIC'}
            onChange={onInterxTypeChange}
          />
          <Form.Radio
            label="Query"
            name="interxType"
            value="QUERY"
            checked={interxType === 'QUERY'}
            onChange={onInterxTypeChange}
          />
          <Form.Radio
            label="RPC"
            name="interxType"
            value="RPC"
            checked={interxType === 'RPC'}
            onChange={onInterxTypeChange}
          />
          <Form.Radio
            label="Constant"
            name="interxType"
            value="CONSTANT"
            checked={interxType === 'CONSTANT'}
            onChange={onInterxTypeChange}
          />
        </Form.Group>
        <Form.Field>
          <Dropdown
            placeholder="Pallets / RPC"
            fluid
            label="Pallet / RPC"
            onChange={onPalletCallableParamChange}
            search
            selection
            state="palletRpc"
            value={palletRpc}
            options={palletRPCs}
          />
        </Form.Field>
        <Form.Field>
          <Dropdown
            placeholder="Callables"
            fluid
            label="Callable"
            onChange={onPalletCallableParamChange}
            search
            selection
            state="callable"
            value={callable}
            options={callables}
          />
        </Form.Field>
        {paramFields.map((paramField, ind) => (
          <Form.Field key={`${paramField.name}-${paramField.type}`}>
            <Input
              placeholder={paramField.type}
              fluid
              type="text"
              label={paramField.name}
              state={{ ind, paramField }}
              value={inputParams[ind] ? inputParams[ind].value : ''}
              onChange={onPalletCallableParamChange}
            />
            {paramField.optional ? (
              <Label
                basic
                pointing
                color="teal"
                content={getOptionalMsg(interxType)}
              />
            ) : null}
          </Form.Field>
        ))}
        <Form.Field style={{ textAlign: 'center' }}>
          <InteractorSubmit
            setStatus={setStatus}
            attrs={{
              interxType,
              palletRpc,
              callable,
              inputParams,
              paramFields,
            }}
          />
        </Form.Field>
        <div style={{ overflowWrap: 'break-word' }}>{status}</div>
      </Form>
    </Grid.Column>
  )
}

function InteractorSubmit(props) {
  const {
    attrs: { interxType },
  } = props
  if (interxType === 'QUERY') {
    return <TxButton label="Query" type="QUERY" color="blue" {...props} />
  } else if (interxType === 'EXTRINSIC') {
    return <TxGroupButton {...props} />
  } else if (interxType === 'RPC' || interxType === 'CONSTANT') {
    return <TxButton label="Submit" type={interxType} color="blue" {...props} />
  }
}

export default function Interactor(props) {
  const { api } = useSubstrateState()
  return api.tx ? <Main {...props} /> : null
}
