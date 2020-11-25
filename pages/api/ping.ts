import { NextApiRequest, NextApiResponse } from 'next';

const parseNightbotChannel = (channelParams: string) => {
    const params = new URLSearchParams(channelParams);
  
    return {
      name: params.get('name'),
      displayName: params.get('displayName'),
      provider: params.get('provider'),
      providerId: params.get('providerId')
    };
  };
  
  const parseNightbotUser = (userParams: string) => {
    const params = new URLSearchParams(userParams);
  
    return {
      name: params.get('name'),
      displayName: params.get('displayName'),
      provider: params.get('provider'),
      providerId: params.get('providerId'),
      userLevel: params.get('userLevel')
    };
  };

  // ping.ts

export default async function (req: NextApiRequest, res: NextApiResponse) {
    const channel = parseNightbotChannel(
      req.headers['nightbot-channel'] as string
    );
  
    const user = parseNightbotUser(req.headers['nightbot-user'] as string);
  
    res
      .status(200)
      .send(
        `Hello! Your username is ${user.displayName} and the current channel is ${channel.displayName}.`
      );
  }