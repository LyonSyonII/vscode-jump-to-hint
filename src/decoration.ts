import {
    Position,
    Range,
    TextEditor,
    TextEditorDecorationType,
    DecorationOptions,
    window
} from 'vscode';
import * as _ from './common';

export function applyDecoration(status: _.ExtensionStatus): boolean {
    switch (status.state) {
        case _.ExtensionState.ActiveWordHint:
            return applyDecorationByPosition(status);
        case _.ExtensionState.ActiveLineHint:
            return applyDecorationByPosition(status);
        case _.ExtensionState.ActiveSearchHint:
            return applyDecorationByRange(status);
    }
    return false;
}

// 装飾を適用する
function applyDecorationByPosition(status: _.ExtensionStatus): boolean {
    status.targetEditorList.forEach((editor, i) => {
        const positionList = status.positionList[i];
        const labelList = status.labelList[i];
        const foreground = status.foregroundDecorationList[i];
        const background = status.backgroundDecorationList[i];
        const target = status.targetEditorList[i];

        if (!!positionList && !!labelList && !!target) {
            const list = getHintParamList(positionList, labelList, status.inputLabel);
            if (foreground) {
                target.setDecorations(foreground, getForegroundDecorationOptionList(list));
            }
            if (background) {
                target.setDecorations(background, getBackgroundDecorationOptionList(list));
            }
        }
    });
    return true;
}

function applyDecorationByRange(status: _.ExtensionStatus): boolean {
    status.targetEditorList.forEach((editor, i) => {
        const rangeList = status.rangeList[i];
        const labelList = status.labelList[i];
        const foreground = status.foregroundDecorationList[i];
        const background = status.backgroundDecorationList[i];
        const highlight = status.highlightDecorationList[i];
        const target = status.targetEditorList[i];

        if (!!rangeList && !!labelList && !!target) {
            // 位置に変換
            const positionList = rangeList.map((r, i) => {
                return r.start;
            });

            const list = getHintParamList(positionList, labelList, status.inputLabel);
            if (foreground) {
                target.setDecorations(foreground, getForegroundDecorationOptionList(list));
            }
            if (background) {
                target.setDecorations(background, getBackgroundDecorationOptionList(list));
            }
            if (highlight) {
                target.setDecorations(highlight, getHighlightDecorationOptionList(list, rangeList));
            }
        }
    });
    return true;
}

function getHintParamList(positionList: Position[], labelList: string[], inputLabel: string): _.HintParam[] {
    const list: _.HintParam[] = positionList.map((p, i) => {
        if (labelList[i]) {
            return { pos: p, label: labelList[i] };
        }
        return { pos: p, label: '' };
    });
    
    const re = new RegExp('^' + inputLabel + '.*', 'i');
    return list.filter((param, i) => {
        return (re.test(param.label));
    });
}

export function getForegroundDecorationList(setting: _.UserSetting, textEditorList: TextEditor[]): TextEditorDecorationType[] {
    const list: TextEditorDecorationType[] = [];
    textEditorList.forEach((editor) => {
        list.push(window.createTextEditorDecorationType({
            after: {
                color: setting.theme.fontColor,
                width: '0',
                fontWeight: 'normal'
            },
        }));
    });
    return list;
}

export function getBackgroundDecorationList(setting: _.UserSetting, textEditorList: TextEditor[]): TextEditorDecorationType[] {
    const list: TextEditorDecorationType[] = [];
    textEditorList.forEach((editor) => {
        list.push(window.createTextEditorDecorationType({
            backgroundColor: setting.theme.backgroundColor,
            opacity: '0',
            borderRadius: '2px',
            border: 'none'
        }));
    });
    return list;
}

export function getHighlightDecorationList(setting: _.UserSetting, textEditorList: TextEditor[]): TextEditorDecorationType[] {
    const list: TextEditorDecorationType[] = [];
    textEditorList.forEach((editor) => {
        list.push(window.createTextEditorDecorationType({
            backgroundColor: setting.theme.highlightColor,
            opacity: '1',
            border: 'none',
        }));
    });
    return list;
}

function getForegroundDecorationOptionList(list: _.HintParam[]): DecorationOptions[] {
    return list.map((param, i) => {
        return {
            range: new Range(param.pos, param.pos),
            renderOptions: {
                after: {
                    contentText: param.label,
                }
            }
        }
    });
}

function getBackgroundDecorationOptionList(list: _.HintParam[]): DecorationOptions[] {
    return list.map((param, i) => {
        return {
            range: new Range(
                param.pos.line, param.pos.character,
                param.pos.line, param.pos.character + param.label.length
            )
        }
    });
}

function getHighlightDecorationOptionList(hintList: _.HintParam[], rangeList: Range[]): DecorationOptions[] {
    const list: DecorationOptions[] = [];
    for (let i = 0; i < rangeList.length; i++) {
        const hint = hintList[i];
        const range = rangeList[i];
        if (!hint || !range) continue;
        
        const l = range.end.character - range.start.character;
        if (l > hint.label.length) {
            list.push({
                range: new Range(
                    range.start.line, range.start.character + hint.label.length,
                    range.end.line, range.end.character
                )
            });
        }
    }
    return list;
}
