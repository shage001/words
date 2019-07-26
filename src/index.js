import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

const wordsServerURL = 'https://us-south.functions.cloud.ibm.com/api/v1/web/shage001%40gmail.com_dev/default/Words.json';
const buttonMessageMap = {'give-up': 'Give up?', 'correct': 'Correct!', 'incorrect': 'Incorrect.'};


function Definition(props) {
    return (
        <tr className="definition">
            <td className="definition-number">{props.number}.</td>
            <td className="definition-definition"><span dangerouslySetInnerHTML={{ __html: props.definition }} /></td>
        </tr>
    )
}


class Definitions extends React.Component {

    render() {
        var definitions = this.props.definitions.slice();

        const definitionsList = definitions.map((definition, i) => {
            return (
                <Definition
                    key={i}
                    number={definition["sn"]}
                    definition={parseDefinition(definition["definition"])}
                />
            );
        });

        return (
            <table className="definitions">
                <tbody>
                    {definitionsList}
                </tbody>
            </table>
        );
    }
}


class Textbox extends React.Component {
  render() {
    return (
      <input
        autoFocus
        type="text" 
        className="form-control1" 
        value={this.props.input}
        onChange={(e) => this.props.onChange(e)}
        onKeyPress={(e) => this.props.onKeyPress(e)}
      />
    );
  }
}


class Game extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            input: '',
            word: '',
            definitions: [],
            buttonDisplay: 'give-up',  // 'give-up', 'correct', 'incorrect'
        };
    }

    componentWillMount() {
        this.getWordAndUpdateState();
    }
    
    getWord = async () => {
        const response = await fetch(wordsServerURL);
        const body = await response.json();

        if (response.status !== 200) {
            throw Error(body.message);
        }
        return body;
    };

    getWordAndUpdateState() {
        this.getWord()
            .then(res => {
                console.log(res);
                this.setState({
                    word: res.data.word,
                    definitions: JSON.parse(JSON.stringify(res.data.definitions)),
                });
            })
            .catch(err => {
                console.error(err);
            });
    }

    handleClick() {
        if (!this.state.input) {
            this.handleGiveUp();
        }
        else {
            const userAnswer = this.state.input.toLowerCase();
            if (this.state.word === userAnswer) {
                this.setState({
                    buttonDisplay: 'correct',
                });
            }
            else {
                this.setState({
                    input: this.state.word,
                    buttonDisplay: 'incorrect',
                });
            }
            setTimeout(() => {
                this.setState({
                    input: '',
                    buttonDisplay: 'give-up',
                });
                this.getWordAndUpdateState();
            }, 1200);
        }
    }

    handleGiveUp() {
        this.setState({
            input: this.state.word,
        });
        setTimeout(() => {
            this.setState({
                input: '',
            });
            this.getWordAndUpdateState();
        }, 2000);
    }

    handleChange(e) {
        this.setState({
            input: e.target.value,
        });
    }

    handleKeyPress(e) {
        if (e.key === "Enter") {
            this.handleClick();
        }
    }

    render() {
        return (
            <div className="text-center">
                <h1>Words</h1>
                <div className="quiz">
                    <div className="definition-wrapper">
                        <Definitions
                            definitions={this.state.definitions}
                        />
                    </div>
                    {this.state.showAnswer &&
                        <div className="answer-wrapper">
                            <span className="answer">{this.state.answers[this.state.curQuestion]}</span>
                        </div>
                    }
                    <Textbox
                      input={this.state.input}
                      onChange={(e) => this.handleChange(e)}
                      onKeyPress={(e) => this.handleKeyPress(e)}
                    />
                    <div>
                        <button className={`button ${this.state.buttonDisplay}`} onClick={() => this.handleGiveUp()}>
                            {buttonMessageMap[this.state.buttonDisplay]}
                        </button>
                    </div>
                </div>
            </div>
        );
    }
}


// function parseNumber(number) {
//     number = number.replace(/\([0-9]\)/g, '');

//     return number;
// }


function parseDefinition(definition) {
    var parenOpenIndex = definition.indexOf('{dx_def}');
    var parenCloseIndex = definition.indexOf('{/dx_def}') + 9;
    while (parenOpenIndex > 0 && parenCloseIndex > 0) {
        definition = definition.substring(0, parenOpenIndex) + definition.substring(parenCloseIndex);
        parenOpenIndex = definition.indexOf('{dx_def}');
        parenCloseIndex = definition.indexOf('{/dx_def}') + 9;
    }

    parenOpenIndex = definition.indexOf('{dx}');
    parenCloseIndex = definition.indexOf('{/dx}') + 5;
    while (parenOpenIndex > 0 && parenCloseIndex > 0) {
        definition = definition.substring(0, parenOpenIndex) + definition.substring(parenCloseIndex);
        parenOpenIndex = definition.indexOf('{dx}');
        parenCloseIndex = definition.indexOf('{/dx}') + 5;
    }

    var dlinkOpenIndex = definition.indexOf('{d_link|');
    var dlinkMiddleIndex = definition.indexOf('|', dlinkOpenIndex + 8);
    var dlinkCloseIndex = definition.indexOf('}', dlinkMiddleIndex);
    if (dlinkOpenIndex > 0 && dlinkCloseIndex > 0) {
        definition = definition.substring(0, dlinkOpenIndex) + 
                     definition.substring(dlinkOpenIndex + 8, dlinkMiddleIndex) + 
                     definition.substring(dlinkCloseIndex + 1);
        dlinkOpenIndex = definition.indexOf('{d_link|');
        dlinkMiddleIndex = definition.indexOf('|', dlinkOpenIndex + 8);
        dlinkCloseIndex = definition.indexOf('}', dlinkMiddleIndex);
    }
    
    definition = definition.replace(/{bc}/g, '<strong>:</strong> ');
    definition = definition.replace(/{sx\|/g, '<span class="synonym">');
    definition = definition.replace(/\|\|}/g, '</span>');
    definition = definition.replace(/{d_link\|/g, '');
    definition = definition.replace(/{a_link\|/g, '');
    definition = definition.replace(/\|\|[0-9]/g, '');

    definition = definition.replace(/}/g, '');
    return definition;
}


ReactDOM.render(
  <Game/>,
  document.getElementById('root')
);
