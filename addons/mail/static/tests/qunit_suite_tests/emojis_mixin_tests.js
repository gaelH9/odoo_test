/** @odoo-module **/
import EmojiMixin from '../../src/js/emojis_mixin';

QUnit.module('mail', function () {
    QUnit.module('emojis mixin');
    QUnit.test('Emoji formatter handles compound emojis', (assert) => {
        const testString = "π©πΏtestπ©πΏπ©tπ©";
        const expectedString = "<span class='o_mail_emoji'>π©πΏ</span>test<span class='o_mail_emoji'>π©πΏπ©</span>t<span class='o_mail_emoji'>π©</span>";
        assert.deepEqual(EmojiMixin._formatText(testString), expectedString);
    });
});
