import {getInputList} from '../src/inputs';
import * as core from '@actions/core';
jest.mock('@actions/core');

describe('inputs', () => {
  describe('#getInputList', () => {
    it('can parse input lists', async () => {
      const input = `my awesome
      input
      `;
      jest.spyOn(core, 'getInput').mockReturnValue(input);
      expect(await getInputList('my-input')).toStrictEqual(
        input.split('\n').map(s => s.trim())
      );
    });
  });
});
