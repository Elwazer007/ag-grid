import {nextTick} from 'vue';

const KEY_ENTER = 'Enter';
const KEY_TAB = 'Tab';

export default {
    template: `<input :ref="'input'" class="simple-input-editor" @keydown="onKeyDown($event)" v-model="value"/>`,
    data() {
        return {
            value: '',
            cancelBeforeStart: true
        };
    },
    methods: {
        getValue() {
            return this.value;
        },

        isCancelBeforeStart() {
            return this.cancelBeforeStart;
        },

        setInitialState(params) {
            let startValue;

            if (params.charPress) {
                // if a letter was pressed, we start with the letter
                startValue = params.charPress;
            } else {
                // otherwise we start with the current value
                startValue = params.value;
            }

            this.value = startValue;
        },

        // will reject the number if it greater than 1,000,000
        // not very practical, but demonstrates the method.
        isCancelAfterEnd() {
            return this.value > 1000000;
        },

        onKeyDown(event) {
            if (event.key === 'Escape') {
                return;
            }
            if (this.isLeftOrRight(event)) {
                event.stopPropagation();
                return;
            }

            if (!this.finishedEditingPressed(event) && !this.isKeyPressedNumeric(event)) {
                if (event.preventDefault) event.preventDefault();
            }
        },

        isCharNumeric(charStr) {
            return /\d/.test(charStr);
        },

        isKeyPressedNumeric(event) {
            const charStr = event.key;
            return this.isCharNumeric(charStr);
        },

        finishedEditingPressed(event) {
            const key = event.key;
            return key === KEY_ENTER || key === KEY_TAB;
        },

        isLeftOrRight(event) {
            return ['ArrowLeft', 'ArrowRight'].indexOf(event.key) > -1;
        }
    },

    created() {
        this.setInitialState(this.params)

        // only start edit if key pressed is a number, not a letter
        this.cancelBeforeStart =
            this.params.charPress && '1234567890'.indexOf(this.params.charPress) < 0;
    },
    mounted() {
        nextTick(() => {
            // need to check if the input reference is still valid - if the edit was cancelled before it started there
            // wont be an editor component anymore
            if (this.$refs.input) {
                this.$refs.input.focus();
            }
        });
    },
};
