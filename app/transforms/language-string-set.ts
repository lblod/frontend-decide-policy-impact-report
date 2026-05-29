import { typeOf } from '@ember/utils';
import { assert } from '@ember/debug';
import { LangString } from '../transforms/language-string';
import Transform from '@ember-data/serializer/transform';

type SerializedLangStringSet = Array<{ content: string; language: string }> | null;

export default class LanguageStringSetTransform extends Transform {
  deserialize(serialized: SerializedLangStringSet): LangString[] {
    assert(
      `Expected array but got ${typeOf(serialized)}`,
      !serialized || typeOf(serialized) === 'array',
    );
    const mapped = (serialized ?? []).map(
      (item) => new LangString(item['content'], item['language']),
    );

    const english = mapped.filter((item) => item.language === 'en');
    if (english.length > 0) {
      return english;
    }

    return mapped;
  }

  serialize(deserialized: LangString[] | null): LangString[] | null {
    assert(
      `Expected array but got ${typeOf(deserialized)}`,
      !deserialized || typeOf(deserialized) === 'array',
    );
    return deserialized;
  }
}
