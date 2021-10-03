import './App.css';
import { useEffect, useRef, useState } from 'react';
import Amplify, { Auth } from 'aws-amplify';
import MetaMaskOnboarding from '@metamask/onboarding';
import { Box, Stack, Input,Text, Button } from "@chakra-ui/react"

function App() {
  const [user, setUser] = useState(null);
  const [region, setRegion] = useState(null);

  const onboarding = useRef(null);
  const cognitoPoolIdRef = useRef(null);
  const cognitoWebClientIdRef = useRef(null);
  const regionRef = useRef(null);

  useEffect(() => {
    if (!onboarding.current) {
      onboarding.current = new MetaMaskOnboarding();
    }
  }, []);

  const onSignIn = async () => {
    if (MetaMaskOnboarding.isMetaMaskInstalled()) {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts.length > 0) {
        const address = accounts[0];
        const cognitoUser = await handleAmplifySignIn(address);
        const messageToSign = cognitoUser.challengeParam.message;
        const signature = await window.ethereum.request({
          method: 'personal_sign',
          params: [address, messageToSign],
        });
        await Auth.sendCustomChallengeAnswer(cognitoUser, signature);
        await checkUser();
      }
    } else {
      onboarding.current.startOnboarding();
    }
  };

  const handleAmplifySignIn = async address => {
    try {
      const cognitoUser = await Auth.signIn(address);
      return cognitoUser;
    } catch (err) {
      /*Cognito doesn't give us a lot of flexibility on error responses
      so we'll have to string match our 'User Not Found' error here
      and create a cognito user with the address as their username if they don't exist*/
      if (err && err.message && err.message.includes('[404]')) {
        const params = {
          username: address,
          password: getRandomString(30),
        };
        await Auth.signUp(params);
        return handleAmplifySignIn(address);
      } else {
        throw err;
      }
    }
  };

  const getRandomString = bytes => {
    const randomValues = new Uint8Array(bytes);
    window.crypto.getRandomValues(randomValues);
    return Array.from(randomValues).map(intToHex).join('');
  };

  const intToHex = nr => {
    return nr.toString(16).padStart(2, '0');
  };

  const onSignOut = async () => {
    try {
      await Auth.signOut();
      await checkUser();
    } catch (err) {
      console.error('onSignOut error: ', err);
    }
  };

  const checkUser = async () => {
    try {
      const _user = await Auth.currentAuthenticatedUser();
      setUser(_user);
      console.log('got user', _user);
    } catch (err) {
      setUser(null);
      console.error('checkUser error', err);
    }
  };

  const setupCognito = () => {
    const cognitoPoolId = cognitoPoolIdRef.current.value;
    const cognitoWebClientId = cognitoWebClientIdRef.current.value;
    const region = regionRef.current.value || 'us-east-1';

    if(!cognitoPoolId || !cognitoWebClientId) {
      console.error('UserPoolId or CognitoWebClientID missing');
      return;
    }

    Amplify.configure({
      Auth: {
        region,
        userPoolId: cognitoPoolId,
        userPoolWebClientId: cognitoWebClientId,
        authenticationFlowType: 'CUSTOM_AUTH',
      }  
    });

    setRegion(region);
  }

  return (
    <Stack h="100vh" bg="gray.100" justifyContent="center" alignItems='center'>
      <Stack bg="white" p={4} minW="400px" borderRadius="1px" rounded="lg"  alignItems="center">
        {!region && (
          <Stack>
            <Box w="100%">
              <Text>User Pool ID</Text>
              <Input ref={cognitoPoolIdRef} placeholder="Cognito Pool ID" />
            </Box>
            <Box w="100%">
              <Text>User Pool Web Client</Text>
              <Input ref={cognitoWebClientIdRef} placeholder="Cognito Web Client ID" />
            </Box>
            <Box w="100%">
              <Text>Region</Text>
              <Input ref={regionRef} placeholder="us-east-1" />
            </Box>
            <Button onClick={setupCognito}>Setup Cognito</Button>
          </Stack>
        )}

        {!user && region && <Button onClick={onSignIn}>Connect Wallet</Button>}

        {user && (
          <Stack spacing={4}>
            <Text>Current User: <a style={{textDecoration:"underline"}} href={`https://console.aws.amazon.com/cognito/users/?region=${region}#/pool/${user.pool.userPoolId}/users/${user.username}`} rel="noreferrer" target="_blank">{user.attributes.sub}</a></Text>
            <Button w="100%" onClick={onSignOut}>Sign Out</Button>
          </Stack>
        )}
      </Stack>
      <Stack align="center">
        <a style={{textDecoration:"underline"}} href="https://github.com/DavidBarrick/cognito-wallet-login" target="_blank" rel="noreferrer">GitHub Repo</a>
        <Text>Created By <a style={{textDecoration:"underline"}} href="https://twitter.com/DavBarrick" target="_blank" rel="noreferrer">@DavBarrick</a></Text>
      </Stack>
    </Stack>
  );
}

export default App;
