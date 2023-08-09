/*
 * Copyright 2021 Spotify AB
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React, { useCallback, useState } from 'react';
import { FieldProps } from '@rjsf/core';
import Select from '@material-ui/core/Select';
import InputLabel from '@material-ui/core/InputLabel';
import { FormControl, FormHelperText } from '@material-ui/core';
import useBus from 'use-bus';
import LinearProgress from '@material-ui/core/LinearProgress';

import { makeStyles } from '@material-ui/core/styles';
import MenuItem from '@material-ui/core/MenuItem';

import { customAzureDevopsApiRef } from '@internal/plugin-custom-apis-apiref';
import { useApi } from '@backstage/core-plugin-api';

const useStyles = makeStyles(_theme => ({
  formControl: {
    minWidth: '100%',
  },
  selectEmpty: {
    // marginTop: theme.spacing(2),
  },
}));

export const ProjectPicker = ({
  onChange,
  rawErrors,
  formData,
  schema: { description },
}: FieldProps<string>) => {
  const defaultValue = 'Selecione um Projeto';

  const classes = useStyles();

  const initialState = formData ? formData : defaultValue;
  const [project, setProject] = useState(initialState);

  const [projects, setProjects] = useState<string[]>([initialState]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  const azureApi = useApi(customAzureDevopsApiRef);

  const updateProject = useCallback(
    (evt: React.ChangeEvent<{ name?: string; value: unknown }>) => {
      const selected = evt.target.value as string;
      if (selected.toLocaleLowerCase() === defaultValue.toLocaleLowerCase()) {
        setProject(defaultValue);
        onChange(undefined);
      } else {
        setProject(selected);
        onChange(selected);
      }
    },
    [onChange],
  );
  async function populateProjectsFromOrg(organization: string) {
    setProjects([defaultValue]);
    setProject(defaultValue);
    onChange(undefined);

    if (organization === '') {
      return;
    }
    setLoadingProjects(true);

    var projects = await azureApi.getCurrentUserVisibleProjects(organization);

    projects.sort(function(a, b) {
      var textA = a.toUpperCase();
      var textB = b.toUpperCase();
      return textA < textB ? -1 : textA > textB ? 1 : 0;
    });

    setProjects([defaultValue].concat(projects));

    setLoadingProjects(false);
  }

  useBus(
    '@@azdo_project_picker_from_org',
    payload => {
      setTimeout(() => {
        populateProjectsFromOrg(payload.organization);
      }, 0);
    },
    [onChange, formData, project, projects],
  );

  return (
    <div>
      <FormControl variant="outlined" className={classes.formControl}>
        <InputLabel id="demo-simple-select-outlined-label">Projeto</InputLabel>
        <Select
          labelId="demo-simple-select-outlined-label"
          id="demo-simple-select-outlined"
          value={project}
          onChange={updateProject}
          label="Projeto"
          required
          disabled={loadingProjects}
          error={rawErrors?.length > 0 && !project}
        >
          {projects.map((i, index) => (
            <MenuItem key={index} value={i}>
              {index == 0 ? <span>{i}</span> : <strong>{i}</strong>}
            </MenuItem>
          ))}
        </Select>
        <FormHelperText>{description}</FormHelperText>
        <LinearProgress hidden={!loadingProjects} />
      </FormControl>
    </div>
  );
};
