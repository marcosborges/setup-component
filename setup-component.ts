import { createTemplateAction } from '@backstage/plugin-scaffolder-backend';
import { Config } from '@backstage/config';
import { Logger } from 'winston';
import axios from 'axios';

export const setupComponentAction = (options: {
  config: Config;
  logger: Logger;
}) => {
  return createTemplateAction<{
    repoInfo: object;
  }>({
    id: 'setup-component',
    schema: {
      input: {
        required: ['repoInfo'],
        type: 'object',
        properties: {
          repoInfo: {
            type: 'object',
            properties: {
              organization: {
                title: 'organization',
                description: 'Nome da organização',
              },
              owner: {
                title: 'owner',
                description: 'Nome do projeto azuredevops',
              },
              repo: {
                title: 'repo',
                description: 'Nome do repositório',
              }
            }
          }
        },
      },
      output: {
        type: 'object',
        properties: {
          definition_id: {
            title: 'ID do pipeline criado para o repositório',
            type: 'string',
          },
        },
      },
    },
    async handler(ctx) {
      ctx.logger.info(`Params: ${JSON.stringify(ctx.input)}`);
      const payload = {
        "stagesToSkip": [],
        "resources": {
            "repositories": {
                "self": {
                    "refName": "refs/heads/main"
                }
            }
        },
        "templateParameters": {
            "project": ctx.input.repoInfo?.owner,
            "repo": ctx.input.repoInfo?.repo
        },
        "variables":{}
      };
      const token = Buffer.from(`:${process.env.AZURE_TOKEN}`).toString(
        'base64',
      );
      const url = 'https://dev.azure.com/ORG/PROJECT_ID/_apis/pipelines/20/runs';
      const response = await axios.post(url,
        payload,    
        {
          headers: {
            'Authorization': `Basic ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json;api-version=5.1-preview.1;excludeUrls=true;enumsAsNumbers=true;msDateFormat=true;noArrayWrap=true'
          },
        },
      );
      const data = response.data;
      ctx.logger.info(`pipeline ${data.pipeline.name}`);
      ctx.logger.info(`state ${data.state}`);
      ctx.logger.info(`buildUrl ${data.url}`);
      ctx.logger.info(`buildName ${data.name}`);
      ctx.output('pipeline', data.pipeline.name);
      ctx.output('state', data.state);
      ctx.output('buildUrl', data.url);
      ctx.output('buildName', data.name);
    },
  });
};
