import { assert } from '@ember/debug';
import { typeOf } from '@ember/utils';
import Transform from '@ember-data/serializer/transform';

const LangString = function (content, lang) {
  this.content = content;
  this.language = lang;
  this.toString = function () {
    if (!this.language || this.language == 'en') {
      return this['content'];
    }
    return `${this['content']} (${this['language']})`;
  };
};

export default class LangStringTransform extends Transform {
  deserialize(serialized) {
    if (serialized != null) {
      if (typeof serialized === 'string') {
        return new LangString(serialized, null);
      }
      return new LangString(serialized['content'], serialized['language']);
    } else {
      return null;
    }
  }

  serialize(deserialized) {
    assert(
      `Expected object but got ${typeOf(deserialized)}`,
      !deserialized || typeOf(deserialized) === 'object',
    );
    return deserialized;
  }
}

export { LangString };
