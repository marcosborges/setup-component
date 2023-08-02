import { createTemplateAction } from '@backstage/plugin-scaffolder-backend';
import { Config } from '@backstage/config';
import { Logger } from 'winston';
import axios from 'axios';
import fs from 'fs-extra';

export const setupOpenAPIAction = (options: {
  config: Config;
  logger: Logger;
}) => {
  return createTemplateAction<{
    info: object;
  }>({
    id: 'setup-openapi',
    schema: {
      input: {
        required: ['openapi'],
        type: 'object',
        properties: {
          info: {
            type: 'object',
            properties: {
              openapi: {
                title: 'openapi',
                description: 'Input openapi',
              }
            }
          }
        },
      },
      output: {
        type: 'object',
        properties: {
          openapi: {
            title: 'Generated openapi',
            type: 'string',
          },
        },
      },
    },
    async handler(ctx) {
      ctx.logger.info(`Params: ${JSON.stringify(ctx.input)}`);
      
      var template = {
          "x-amazon-apigateway-integration" : {
              "type" : "http",
              "connectionId" : "$${stageVariables.vpc_link}",
              "httpMethod" : "ANY",
              "uri" : "https://$${stageVariables.target_hostname}",
              "responses" : {},
              "passthroughBehavior" : "when_no_match",
              "connectionType" : "VPC_LINK"
          }
      }
      
      var openapi = JSON.parse(ctx.input?.openapi)
      
      
      for(var path in openapi.paths){
        ctx.logger.info(`Path: ${JSON.stringify(path)}`);
        for(var method in openapi.paths[path]){
          ctx.logger.info(`Method: ${JSON.stringify(method)}`);
          if(!("x-amazon-apigateway-integration" in openapi.paths[path][method])){
            ctx.logger.info(`"x-amazon-apigateway-integration" in openapi.paths[path][method]`);
            template["x-amazon-apigateway-integration"]['httpMethod'] = method
            var responses: any = {}
            for(var response in openapi.paths[path][method].responses){
              ctx.logger.info(`Response: ${JSON.stringify(response)}`);
              responses[response] = {
                "statusCode" : response
              }
            }
            template["x-amazon-apigateway-integration"]['responses'] = responses
            openapi['paths'][path][method] = {
              ...openapi['paths'][path][method],
              ...template
            }
          }
        }  
      }
      ctx.logger.info(JSON.stringify(openapi));
      ctx.output('openapi', JSON.stringify(openapi, null, '    '));
    },
  });
};
