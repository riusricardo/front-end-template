import React, { useEffect, useState } from 'react'
import { Form, Card, Icon, Grid } from 'semantic-ui-react'

import { useSubstrateState } from './substrate-lib'
const INIT_URL = '/substrate-front-end-template'

function Main(props) {
  const { api, socket } = useSubstrateState()
  const [nodeInfo, setNodeInfo] = useState({})
  const [conn] = useState(window.location.href.split('?')[1] || undefined)

  useEffect(() => {
    const getInfo = async () => {
      try {
        const [chain, nodeName, nodeVersion] = await Promise.all([
          api.rpc.system.chain(),
          api.rpc.system.name(),
          api.rpc.system.version(),
        ])
        setNodeInfo({ chain, nodeName, nodeVersion })
      } catch (e) {
        console.error(e)
      }
    }
    getInfo()
  }, [api.rpc.system])

  return (
    <Grid.Column>
      <Card>
        <Card.Content>
          <Form>
            <Form.Group style={{ overflowX: 'auto', flexDirection: 'column' }}>
              <label>Connect:</label>
              <Form.Radio
                label="Local"
                name="localNode"
                value="localNode"
                checked={!conn}
                onChange={() => {
                  window.location.href = INIT_URL
                }}
              />
              <Form.Radio
                label="Westend Light Client"
                name="westend_lc"
                value="westend_lc"
                checked={conn === 'westend_light_client'}
                onChange={() => {
                  window.location.href = INIT_URL + '?westend_light_client'
                }}
              />
              <Form.Radio
                label="Rococo Light Client"
                name="rococo_lc"
                value="rococo_lc"
                checked={conn === 'rococo_light_client'}
                onChange={() => {
                  window.location.href = INIT_URL + '?rococo_light_client'
                }}
              />
            </Form.Group>
          </Form>
          <Card.Header>{nodeInfo.nodeName}</Card.Header>
          <Card.Meta>
            <span>{nodeInfo.chain}</span>
          </Card.Meta>
          {!conn ? <Card.Description>{socket}</Card.Description> : null}
        </Card.Content>
        <Card.Content extra>
          <Icon name="setting" />v{nodeInfo.nodeVersion}
        </Card.Content>
      </Card>
    </Grid.Column>
  )
}

export default function NodeInfo(props) {
  const { api } = useSubstrateState()
  return api.rpc &&
    api.rpc.system &&
    api.rpc.system.chain &&
    api.rpc.system.name &&
    api.rpc.system.version ? (
    <Main {...props} />
  ) : null
}
