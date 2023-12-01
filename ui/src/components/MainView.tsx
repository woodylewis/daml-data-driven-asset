// Copyright (c) 2022 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import React, { useMemo } from 'react';
import { Container, Grid, Header, Icon, Segment, Divider, Button } from 'semantic-ui-react';
import { Party } from '@daml/types';
import { User } from '@daml.js/create-daml-app';
import { publicContext, userContext } from './App';
// import UserList from './UserList';
import PartyListEdit from './PartyListEdit';
import MessageEdit from './MessageEdit';
import MessageList from './MessageList';
// import { DataStream, Enterprise, Bank, AddDataStream } from '@daml.js/create-daml-app/lib/User';

import { FINANCIAL_EVENTS } from './MockEvents';
import { DataStream } from '@daml.js/create-daml-app/lib/User';

// USERS_BEGIN
const MainView: React.FC = () => {
  const username = userContext.useParty();
  const myUserResult = userContext.useStreamFetchByKeys(User.User, () => [username], [username]);
  const aliases = publicContext.useStreamQueries(User.Alias, () => [], []);
  const myUser = myUserResult.contracts[0]?.payload;
  const allUsers = userContext.useStreamQueries(User.User).contracts;
// USERS_END

  // Sorted list of users that are following the current user
  const followers = useMemo(() =>
    allUsers
    .map(user => user.payload)
    .filter(user => user.username !== username)
    .sort((x, y) => x.username.localeCompare(y.username)),
    [allUsers, username]);

  // Map to translate party identifiers to aliases.
  const partyToAlias = useMemo(() =>
    new Map<Party, string>(aliases.contracts.map(({payload}) => [payload.username, payload.alias])),
    [aliases]
  );
  const myUserName = aliases.loading ? 'loading ...' : partyToAlias.get(username) ?? username;

  // FOLLOW_BEGIN
  const ledger = userContext.useLedger();
  const follow = async (userToFollow: Party): Promise<boolean> => {
    try {
      await ledger.exerciseByKey(User.User.Follow, username, {userToFollow});
      return true;
    } catch (error) {
      alert(`Unknown error:\n${JSON.stringify(error)}`);
      return false;
    }
  }
  // FOLLOW_END

  const doStart = async () => {
    let enterprise;
    enterprise = await ledger.fetchByKey(User.Enterprise, username);
    if (enterprise === null) {
      enterprise = await ledger.create(User.Enterprise, { owner: username, dataStreams: [] });
    }
    doMessage('Start Enterprise');

    let auditor;
    auditor = await ledger.fetchByKey(User.Auditor, username);
    if (auditor === null) {
      auditor = await ledger.create(User.Auditor, { owner: username, dataStream: ''});
    }
    doMessage('Start Auditor');

    let bank;
      bank = await ledger.fetchByKey(User.Bank, username);
      if (bank === null) {
        bank = await ledger.create(User.Bank, { owner: username, assets: []});
      }
    doMessage('Start Bank');
  };

  const createAsset = async () => {
    const onLine = await checkBankEntities();
    if (onLine) {
      const theDataStream = await ledger.fetchByKey(User.DataStream, username);
      if (theDataStream) {
        const theAsset = await ledger.create(User.Asset, { owner: username, dataStream: theDataStream.payload });
        const theNewBank = await ledger.exerciseByKey(User.Bank.AddAsset, username, { newAsset: theAsset.contractId});
        doMessage('Create asset');
      } else {
        alert('DataStream not found');
      }
    } else {
      alert('Both Bank and Enterprise need to be logged in');
    }
  };

  const createDataStream = async (theOwner: Party, theCertifier: Party, eventStreamName: string, events: Array<Object>) => {
    const theEvents = JSON.stringify(events);
    const dataStreamInstance = await ledger.create(User.DataStream, { owner: theOwner, certifier: theCertifier, channel: eventStreamName, events: theEvents});
    return dataStreamInstance;
  };

  const certifyDataStream = async () => {
    const onLine = await checkCertifyEntities();
    if (onLine) {
      const dataStream = await ledger.fetchByKey(User.DataStream, username);
      const streamToCertify = dataStream?.payload.events ?? '';
      if (dataStream) {
        const auditor = await ledger.fetchByKey(User.Auditor, username);
        if (auditor) {
          await ledger.exerciseByKey(User.Auditor.CertifyDataStream, username, { streamToCertify });
          await ledger.exerciseByKey(User.DataStream.AddAuditorAsCertifier, username, { newCertifier: auditor.contractId });
          doMessage('Certify data');
        } else {
          alert('Auditor not found');
        }
      } else {
        alert('DataStream not found');
      }
    } else {
      alert('Both Auditor and Enterprise need to be logged in');
    }
  };

  const checkCertifyEntities = async () => {
    const loggedIn = aliases.contracts.map(c => {
      return c.payload.alias;
    });
    return loggedIn.includes('Enterprise') && loggedIn.includes('Auditor'); 
  };

  const checkBankEntities = async () => {
    const loggedIn = aliases.contracts.map(c => {
      return c.payload.alias;
    });
    return loggedIn.includes('Enterprise') && loggedIn.includes('Bank'); 
  };

  const populateData = async () => {
    const dataStream = await createDataStream(username, username, 'FINANCIAL', FINANCIAL_EVENTS);
    await addData(dataStream.payload.events, username);
    const e = await ledger.fetchByKey(User.Enterprise, username);
    doMessage('Populate data');
  };

  const addData = async(streamToAdd: string, username: string): Promise<boolean> => {
    try {
      await ledger.exerciseByKey(User.Enterprise.AddDataStream, username, {streamToAdd});
      return true;
    } catch (error) {
      alert(`Unknown error:\n${JSON.stringify(error)}`);
      return false;
    }

  };

  const doMessage = async (theMessage: string) => {
    if (allUsers[0] && allUsers[0].payload && allUsers[0].payload?.following.length > 0) {
      const others = allUsers.filter( u => {
        return u.payload.username !== username;
      });
      //  hard coded for two other workflow actors in this example
      await ledger.exerciseByKey(User.User.SendMessage, others[0].payload.username, {sender: username, content: theMessage});
      await ledger.exerciseByKey(User.User.SendMessage, others[1].payload.username, {sender: username, content: theMessage});
    }
  };

  return (
    <Container>
      <Grid centered columns={2}>
        <Grid.Row stretched>
          <Grid.Column>
            <Segment>
              <Header as='h2'>
                <Header.Content>
                  {myUserName ?? 'Loading...'}
                </Header.Content>
              </Header>
              <Divider />
              { myUserName === 'Enterprise' && (
                <Segment>
                <Button
                  content="Start"
                  onClick={doStart}
                />
                <Button
                  content="Data"
                  onClick={populateData}
                />
                <Divider /><p/>
                <Button
                  content="Certify"
                  onClick={certifyDataStream}
                />
                <Button
                  content="Asset"
                  onClick={createAsset}
                />
                </Segment>
              )}
              <Divider />
              <PartyListEdit
                parties={myUser?.following ?? []}
                partyToAlias={partyToAlias}
                onAddParty={follow}
              />
            </Segment>
            <Segment>
              <MessageList partyToAlias={partyToAlias}/>
            </Segment>
          </Grid.Column>
        </Grid.Row>
      </Grid>
    </Container>
  );
}

export default MainView;
