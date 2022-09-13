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
      $.fm_macro,
			$.fm_directive,
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

    fm_macro: $ => choice(
      seq(
        $.fm_macro_start_tag,
        repeat($._node),
        choice($.fm_macro_end_tag, $._implicit_end_tag)
      ),
      $.fm_macro_self_closing_tag
    ),

		fm_directive: $ => choice(
      seq(
        choice($.fm_directive_start_tag, $.fm_if_directive_start_tag),
        choice($.fm_directive_end_tag, $._implicit_end_tag)
      ),
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

    fm_macro_start_tag: $ => seq(
      '<@',
      alias($._start_tag_name, $.tag_name),
      repeat($.attribute),
      '>'
    ),

    fm_directive_start_tag: $ => seq(
			"<#",
      choice($.fm_if_directive_start_tag),
			">"
    ),

		fm_if_directive_start_tag: $ => seq(
			"if",
			$._expression,
    ),

		_expression: $ => choice(
			$.identifier,
		),

		identifier: $ => /[a-zA-Z_]+/,

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

    fm_macro_self_closing_tag: $ => seq(
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

    fm_macro_end_tag: $ => seq(
      '</@',
      alias($._end_tag_name, $.tag_name),
      '>'
    ),

    fm_directive_end_tag: $ => seq(
      '</#',
      choice("if"),
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

    attribute_name: $ => /[^<>"'/=\s]+/,

    attribute_value: $ => /[^<>"'=\s]+/,

    quoted_attribute_value: $ => choice(
      seq("'", optional(alias(/[^']+/, $.attribute_value)), "'"),
      seq('"', optional(alias(/[^"]+/, $.attribute_value)), '"')
    ),

    text: $ => /[^<>\s]([^<>]*[^<>\s])?/
  }
});
