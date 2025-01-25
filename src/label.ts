'use strict';

// ヒント表示

import {
    Position,
    Range,
    TextEditor
} from 'vscode';
import * as _ from './common';

export function getLabelListByPosition(setting: _.UserSetting, positionList: Position[][]): string[][] {
    let count = 0;
    positionList.forEach((l) => {
        count += l.length;
    });
    
    let labelList: string[] = [];
    switch (setting.type.hintLengthType) {
        case _.HintLengthType.Fixed:
            labelList = generateFixedLabelList(setting.common.hintCharList, count, setting.type.fixedHintLength);
            break;
        case _.HintLengthType.Variable:
            labelList = generateVariableLabelList(setting.common.hintCharList, count);
            break;
    }
    
    const list: string[][] = [];
    positionList.forEach((l) => {
        list.push(
            labelList.splice(0, l.length)
        );
    });
    return list;
}

export function getLabelListByRange(setting: _.UserSetting, textEditorList: TextEditor[], rangeList: Range[][]): string[][] {
    let count = 0;
    rangeList.forEach((l) => {
        count += l.length;
    });
    
    const ignoreList: string[] = [];
    for (let i = 0; i < textEditorList.length; i++) {
        const editor = textEditorList[i];
        const rl: Range[] = rangeList[i];
        if (!editor || !rl) continue;
        
        rl.forEach((r, i) => {
            const line = editor.document.lineAt(r.end.line);
            const s = line.text.charAt(r.end.character);
            if (!!s && ignoreList.indexOf(s) < 0) {
                ignoreList.push(s);
            }
        });
    }
    
    const charList = setting.common.hintCharList.filter((c, i) => {
        return (ignoreList.indexOf(c) < 0);
    });
    
    let labelList: string[] = [];
    switch (setting.type.hintLengthType) {
        case _.HintLengthType.Fixed:
            labelList = generateFixedLabelList(charList, count, setting.type.fixedHintLength);
            break;
        case _.HintLengthType.Variable:
            labelList = generateVariableLabelList(charList, count);
            break;
    }
    
    const list: string[][] = [];
    rangeList.forEach((l) => {
        list.push(
            labelList.splice(0, l.length)
        );
    });
    return list;
}

function generateFixedLabelList(charList: string[], count: number, length: number): string[] {
    const dfs = (hint: string, list: string[]): string[] => {
        if (list.length >= count) return list;
        if (hint.length < length) {
            for (let i = 0; i < charList.length; i++) {
                dfs(hint + charList[i], list);
            }
        }
        else {
            list.push(hint);
        }
        return list;
    };

    return dfs('', []);
}

// Returns a list of hint strings which will uniquely identify the given number of links.The hint strings may be of different lengths.
// https://github.com/philc/vimium
function generateVariableLabelList(charList: string[], count: number): string[] {
    const hintList: string[] = [''];
    let offset = 0;
    while ((hintList.length - offset < count) || (hintList.length == 1)) {
        const hint = hintList[offset];
        offset += 1;
        for (const c of charList) {
            hintList.push(hint + c);
        }
    }

    return hintList.slice(offset, offset + count);
}

