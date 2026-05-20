import { assert } from '@ember/debug';
import { typeOf } from '@ember/utils';
import Transform from '@ember-data/serializer/transform';

export class LangString {
  content: string;
  language: string | null;

  constructor(content: string, lang: string | null) {
    this.content = content;
    this.language = lang;
  }

  toString(): string {
    if (!this.language || this.language === 'en') {
      return this.content;
    }
    return `${this.content} (${this.language})`;
  }
}

type SerializedLangString = { content: string; language: string } | string;

export default class LangStringTransform extends Transform {
  deserialize(serialized: SerializedLangString | null): LangString | null {
    if (serialized != null) {
      if (typeof serialized === 'string') {
        return new LangString(serialized, null);
      }
      return new LangString(serialized['content'], serialized['language']);
    } else {
      return null;
    }
  }

  serialize(deserialized: LangString | null): LangString | null {
    assert(
      `Expected object but got ${typeOf(deserialized)}`,
      !deserialized || typeOf(deserialized) === 'object',
    );
    return deserialized;
  }
}
