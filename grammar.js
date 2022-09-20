const 
  multiplicative_operators = ['*', '/', '%'],
  additive_operators = ['+', '-'],
  comparative_operators = ['==', '!=', 'lt', '<=', 'gt', '>='];
  // assignment_operators = multiplicative_operators.concat(additive_operators).map(operator => operator + '=').concat('=');

module.exports = grammar({
  name: 'freemarker',

  extras: $ => [
    $.comment,
    /\s+/,
  ],

  externals: $ => [
    $._start_tag_name,
    $._script_start_tag_name,
    $._style_start_tag_name,
    $._end_tag_name,
    $.erroneous_end_tag_name,
    '/>',
    $._implicit_end_tag,
    $.raw_text,
    $.comment,
  ],

  rules: {
    fragment: $ => repeat($._node),

    doctype: $ => seq(
      '<!',
      alias($._doctype, 'doctype'),
      /[^>]+/,
      '>'
    ),

    _doctype: $ => /[Dd][Oo][Cc][Tt][Yy][Pp][Ee]/,

    _node: $ => choice(
      $.doctype,
      $.text,
      $.element,
      $.macro,
      $.directive,
      $.interpolation,
      $.script_element,
      $.style_element,
      $.erroneous_end_tag
    ),

    element: $ => choice(
      seq(
        $.start_tag,
        repeat($._node),
        choice($.end_tag, $._implicit_end_tag)
      ),
      $.self_closing_tag
    ),

    macro: $ => choice(
      seq(
        $.macro_start_tag,
        repeat($._node),
        choice($.macro_end_tag, $._implicit_end_tag)
      ),
      $.macro_self_closing_tag
    ),

    directive: $ => choice(
      $.if_statement,
    ),

    script_element: $ => seq(
      alias($.script_start_tag, $.start_tag),
      optional($.raw_text),
      $.end_tag
    ),

    style_element: $ => seq(
      alias($.style_start_tag, $.start_tag),
      optional($.raw_text),
      $.end_tag
    ),

    start_tag: $ => seq(
      '<',
      alias($._start_tag_name, $.tag_name),
      repeat($.attribute),
      '>'
    ),

    macro_start_tag: $ => seq(
      '<@',
      alias($._start_tag_name, $.tag_name),
      repeat($.attribute),
      '>'
    ),

    if_statement: $ => seq(
      $.if_tag,
      repeat($._node),
      choice($.else_if_statement, $.else_statement, $.if_end_tag)
    ),

    else_if_statement: $ => seq(
      $.else_if_tag,
      repeat($._node),
      choice($.if_end_tag, $.else_statement, $.else_if_statement)
    ),

    else_statement: $ => seq(
      $.else_tag,
      repeat($._node),
      $.if_end_tag,
    ),

    if_tag: $ => seq(
      "<#",
      alias("if", $.if_else_tag_name),
      $._expression,
      ">",
    ),

    else_if_tag: $ => seq(
      "<#",
      alias("elseif", $.if_else_tag_name),
      $._expression,
      ">",
    ),

    else_tag: ($) => seq("<#", alias("else", $.if_else_tag_name), ">"),
    if_end_tag: ($) => seq("</#", alias("if", $.if_else_tag_name), ">"),

    interpolation: $ => seq(
      '${', $._expression, '}'
    ),

    _expression: $ => choice(
      $.number,
      $.identifier,
      $.unary_expression,
      $.binary_expression,
      $.parenthesized_expression,
    ),

    unary_expression: $ => seq(
      field('operator', choice('+', '-', '!')),
      field('operand', $._expression),
    ),

    binary_expression: $ => {
      const table = [
        [3, choice(...multiplicative_operators)],
        [2, choice(...additive_operators)],
        [1, choice(...comparative_operators)],
      ];

      return choice(...table.map(([precedence, operator]) =>
        prec.left(precedence, seq(
          field('left', $._expression),
          field('operator', operator),
          field('right', $._expression)
        ))
      ));
    },

    parenthesized_expression: $ => seq(
      '(',
      $._expression,
      ')'
    ),

    number: () => /[0-9]+/,

    identifier: ($) => prec.left(1, seq(
      /[a-zA-Z_]+/,
      repeat(seq('.', $.identifier)),
      alias(repeat(seq('?', /[a-zA-Z_]+/)), $.modifier),
    )),

    script_start_tag: $ => seq(
      '<',
      alias($._script_start_tag_name, $.tag_name),
      repeat($.attribute),
      '>'
    ),

    style_start_tag: $ => seq(
      '<',
      alias($._style_start_tag_name, $.tag_name),
      repeat($.attribute),
      '>'
    ),

    self_closing_tag: $ => seq(
      '<',
      alias($._start_tag_name, $.tag_name),
      repeat($.attribute),
      '/>'
    ),

    macro_self_closing_tag: $ => seq(
      '<@',
      alias($._start_tag_name, $.tag_name),
      repeat($.attribute),
      '/>'
    ),

    end_tag: $ => seq(
      '</',
      alias($._end_tag_name, $.tag_name),
      '>'
    ),

    macro_end_tag: $ => seq(
      '</@',
      alias($._end_tag_name, $.tag_name),
      '>'
    ),

    erroneous_end_tag: $ => seq(
      '</',
      $.erroneous_end_tag_name,
      '>'
    ),

    attribute: $ => seq(
      $.attribute_name,
      optional(seq(
        '=',
        choice(
          $.attribute_value,
          $.quoted_attribute_value
        )
      ))
    ),

    attribute_name: $ => choice(
      $.interpolation,
      /[^$<>"'/=\s]+/,
    ),

    attribute_value: $ => choice(
      $.interpolation,
      /[^$<>"'=\s]+/
    ),

    quoted_attribute_value: $ => choice(
      seq(
        "'",
        repeat(
          choice(
            alias(/[^'$]+/, $.attribute_value),
            $.interpolation,
          ),
        ),
        "'"
      ),
      seq(
        '"',
        repeat(
          choice(
            alias(/[^"$]+/, $.attribute_value),
            $.interpolation,
          ),
        ),
        '"'
      ),
    ),

    // text: $ => /[^<>\s]([^<>]*[^<>\s])?/
    text: $ => /[^<>$\s]([^<>]*[^<>\s])?/ // TODO: probably wrong,
  }
});
