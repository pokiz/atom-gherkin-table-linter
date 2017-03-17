'use babel';

import GherkinTableLinterView from './gherkin-table-linter-view';
import { CompositeDisposable } from 'atom';

export default {

  gherkinTableLinterView: null,
  modalPanel: null,
  subscriptions: null,

  activate(state) {
    this.gherkinTableLinterView = new GherkinTableLinterView(state.gherkinTableLinterViewState);
    this.modalPanel = atom.workspace.addModalPanel({
      item: this.gherkinTableLinterView.getElement(),
      visible: false
    });

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'gherkin-table-linter:toggle': () => this.toggle()
    }));
  },

  deactivate() {
    this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.gherkinTableLinterView.destroy();
  },

  serialize() {
    return {
      gherkinTableLinterViewState: this.gherkinTableLinterView.serialize()
    };
  },

  get_parts_by_line(lines, positions_by_line) {
    var array_by_line = []
    for (var i = 0; i < lines.length; i++)
    {
      var line = lines[i]
      line_array = []
      if ((i == (lines.length - 1)) && (line.length == 0))
        break;
      tmp_line = line.substring(1, positions_by_line[i][0])
      line_array.push(tmp_line.trim())
      for (var j = 0; j < (positions_by_line[i].length - 1); j++)
      {
        tmp_line = line.substring(positions_by_line[i][j] + 1, positions_by_line[i][j + 1])
        line_array.push(tmp_line.trim())
      }
      array_by_line[i] = line_array
    }
    return array_by_line
  },

  lint_table_in_selected_text(selected_text) {
    lines = selected_text.split('\n')
    separators_positions_by_line = this.get_separators_positions_by_line(lines)
    if (separators_positions_by_line == null) return null;
    parts_by_line = this.get_parts_by_line(lines, separators_positions_by_line)
    max_separators_position_by_column = this.get_max_separators_position_by_column(parts_by_line)
    lines = this.lint_lines(parts_by_line, max_separators_position_by_column)
    return lines.join('\n')
  },

  lint_lines(parts_by_line, max_separators_position_by_column) {
    new_lines = []
    console.log(parts_by_line)
    console.log(max_separators_position_by_column)
    for (var i = 0 ; i < parts_by_line.length ; i++)
    {
      if ((i == (parts_by_line.length - 1)) && (parts_by_line.length == 0))
        break;
      new_line = ""
      for (var k = 0 ; k < parts_by_line[i].length ; k++)
      {
        blanks = ' '
        l = max_separators_position_by_column[k] - parts_by_line[i][k].length
        for (l ; l > 0 ; l--)
        {
          blanks += ' '
        }
        new_line += '| ' + parts_by_line[i][k] + blanks
      }
      new_line += "|"
      new_lines.push(new_line)
    }
    return new_lines
  },

  get_separators_positions_by_line(lines) {
    separator_nbr = null
    positions_by_line = []
    for (var key in lines)
    {
      positions = []
      lines[key] = line = lines[key].trim()
      if ((key == (lines.length - 1)) && (line.length == 0))
        break;
      if ((line.length >= 3)
          && (line[0] === '|')
          && (line[line.length - 1] === '|')
          && (line[line.length - 2] != '\\'))
      {
        for (var i = 1 ; i < line.length ; i++)
        {
          if ((line[i] == '|') && (line[i - 1] != '\\'))
            positions.push(i)
        }
      }else
        positions = null
      if (positions == null)
      {
        atom.notifications.addError("Line " + key + " ssems not to be a Gherkin table line !")
        return;
      }
      if (separator_nbr == null)
        separator_nbr = positions.length
      else if (positions.length != separator_nbr)
      {
        atom.notifications.addError("Line " + key + " of array contains a different number of columns than previous one.", {})
        return;
      }
      positions_by_line[key] = positions
    }
    return positions_by_line
  },

  get_max_separators_position_by_column(parts_by_line) {
    max_separators_position_by_column = []
    for (var i = 0; i < parts_by_line.length ; i++)
    {
      for (var j = 0; j < parts_by_line[i].length; j++)
      {
          if ((typeof max_separators_position_by_column[j] === 'undefined')
              || (positions_by_line[i][j] > max_separators_position_by_column[j]))
              max_separators_position_by_column[j] = parts_by_line[i][j].length
      }
    }
    return max_separators_position_by_column
  },

  toggle() {
    let editor
    if (editor = atom.workspace.getActiveTextEditor()) {
      let selection = editor.getSelectedText()
      linted_table = this.lint_table_in_selected_text(selection)
      editor.insertText(linted_table)
    }
/*    console.log('GherkinTableLinter was toggled!');
    return (
      this.modalPanel.isVisible() ?
      this.modalPanel.hide() :
      this.modalPanel.show()
    );
*/
  }

};
