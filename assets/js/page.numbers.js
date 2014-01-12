/* © 2011-2013 33cube, Inc. All rights reserved. */

// http://www.mredkj.com/javascript/nfbasic.html
function addCommas(nStr) {
  nStr += '';
  x = nStr.split('.');
  x1 = x[0];
  x2 = x.length > 1 ? '.' + x[1] : '';
  var rgx = /(\d+)(\d{3})/;
  while (rgx.test(x1)) {
    x1 = x1.replace(rgx, '$1' + ',' + '$2');
  }
  return x1 + x2;
}

$(function() {
  var $window = $(window),
      $sections = $("#main").find("section"),
      $navUl = $("#sectionNav").find("ul"),
      $navLinks,
      updateSectionsOnChange = true,
      mainTop = $("#main").offset().top;

  function switchToSection(id) {
    var $section = $sections.filter("[id='"+id+"']"),
        currentScroll;

    if ($section.length && !$section.hasClass("selected")) {
      if (window.history.replaceState) {
        window.history.replaceState(null, null, "#"+id);
      }

      // Toggle classes
      $sections.filter(".selected").removeClass("selected");
      $section.addClass("selected");
      $navLinks.filter(".selected").removeClass("selected");
      $navLinks.filter("[href='#"+id+"']").addClass("selected");

      return $section;
    } else {
      return false;
    }
  }

  // Set up nav
  $sections.each(function() {
    var $section = $(this),
        $el,
        id = $section.attr("id");

    $el = $("<li/>").append($("<a/>", {
      href : "#" + id,
      html : $section.attr("data-navtext")
    })).appendTo($navUl);

    $el.on("click", function(e) {
      var $th = $(this),
          $section = switchToSection(id);

      if (!!$section) {
        setTimeout(function() {
          updateSectionsOnChange = false;

          $.scrollTo($section, {
            duration : 500,
            easing : "easeInOutQuad",
            offset : {
                top : Math.round($window.height() / -4)
              },
            onAfter : function() {
                updateSectionsOnChange = true;
              }
          });
        }, 0);
      }

      e.preventDefault();
    });
  });

  $navLinks = $navUl.find("a");

  $window.on("scroll resize orientationchange", function() {
    var scrollTop = $window.scrollTop(),
        windowHeight,
        documentHeight,
        thirdLine,
        $sectionToSelect;

    // $("#sectionNav").css("top", scrollTop > mainTop ? scrollTop - mainTop : 0);
    $("#sectionNav").toggleClass("sticky", scrollTop > mainTop);

    if (updateSectionsOnChange) {
      windowHeight = $window.height();
      documentHeight = $(document).height();

      if (scrollTop + windowHeight >= $(document).height()) {
        $sectionToSelect = $sections.last();
      } else {
        thirdLine = scrollTop + Math.round(windowHeight / 4);

        $sections.each(function() {
          var $th = $(this);

          if ($th.offset().top <= thirdLine) {
            $sectionToSelect = $th;
          } else {
            return false;
          }
        });
      }

      if (!!$sectionToSelect) {
        switchToSection($sectionToSelect.attr("id"));
      }
    }
  });

  // Expandoids
  $(".expandoid").each(function() {
    var $th = $(this);

    $th.find(".expandoid-expand").one("click", function() {
      $th.find(".expandoid-window").css("height", $th.find(".expandoid-content").outerHeight());
      $th.addClass("expanded");
    });
  });

  // Graphs
  $(".graph[data-json]").each(function() {
    var $th = $(this),
        type = $th.data("type"),
        scale = $th.data("scale"),
        isStacked = $th.data("stacked") !== undefined,
        isSideBySide = $th.data("sidebyside") !== undefined,
        isFilled = $th.data("filled") !== undefined,
        hasPoints = $th.data("points") !== undefined,
        usesPercentages = $th.data("percentages") !== undefined,
        usesDollars = $th.data("dollars") !== undefined,
        json = $th.data("json"),
        numSeries = 0,
        formattedData = [],
        barsOverrides = {},
        linesOverrides = {},
        pointsOverrides = {},
        xaxisOverrides = {},
        yaxisOverrides = {},
        gridOverrides = {},
        $plot = $th.find(".graph-content"),
        $legend = $th.find(".graph-legend"),
        $tooltip = $th.find(".graph-tooltip"),
        tooltipItemSeriesIndex,
        tooltipItemDataIndex,
        tooltipLabelFormatter = function(data) { return data[0]; },
        tooltipValueFormatter = function(data) { return addCommas(data[1]); };

    $.each(json, function(key, value) {
      numSeries++;

      formattedData.push({
        label : key,
        color : numSeries - 1,
        bars : {
            order : isSideBySide ? numSeries : null
          },
        data : value
      });
    });

    if (scale === "months") {
      xaxisOverrides = {
        mode : "time",
        timeformat : "%b %Y",
        minTickSize : [1, "month"]
      };

      if (type === "bars") {
        if (isSideBySide) {
          barsOverrides.barWidth = 10*24*60*60*1000;
        } else {
          barsOverrides.barWidth = 17*24*60*60*1000;
        }
      }

      tooltipLabelFormatter = function(data) {
        return new XDate(data[0], true).toString("MMM yyyy");
      };
    } else if (scale === "weeks") {
      xaxisOverrides = {
        mode : "time",
        timeformat : "%b %Y",
        minTickSize : [7, "day"]
      };

      if (type === "bars") {
        if (isSideBySide) {
          barsOverrides.barWidth = 2*24*60*60*1000;
        } else {
          barsOverrides.barWidth = 5*24*60*60*1000;
        }
      }

      tooltipLabelFormatter = function(data) {
        return new XDate(data[0], true).toString("MMM d, yyyy");
      };
    } else if (scale === "days") {
      xaxisOverrides = {
        mode : "time",
        timeformat : "%b %Y",
        minTickSize : [1, "day"]
      };

      if (type === "bars") {
        if (isSideBySide) {
          barsOverrides.barWidth = 4*60*60*1000;
        } else {
          barsOverrides.barWidth = 12*60*60*1000;
        }
      }

      tooltipLabelFormatter = function(data) {
        return new XDate(data[0], true).toString("MMM d, yyyy");
      };
    } else if (scale === "percentiles") {
      xaxisOverrides = {
        min : 0,
        max : 1,
        tickSize : 0.1,
        tickFormatter : function(tick) {
            return Math.round(100 * tick) + "%";
          }
      };

      if (type === "bars") {
        if (isSideBySide) {
          barsOverrides.barWidth = 0.052 / formattedData.length;
        } else {
          barsOverrides.barWidth = 0.052;
        }
      }

      tooltipLabelFormatter = function(data) {
        return Math.round(100 * data[0])+"%";
      };
    } else if (scale === "categories") {
      xaxisOverrides = {
        mode : "categories",
        tickFormatter : function(tick) {
            return tick;
          }
      };

      if (type === "bars") {
        if (isSideBySide) {
          barsOverrides.barWidth = 0.18;
        } else {
          barsOverrides.barWidth = 0.5;
        }
      }
    }

    if (usesPercentages) {
      yaxisOverrides.tickFormatter = function(tick) {
        return Math.round(100 * tick) + "%";
      };

      tooltipValueFormatter = function(data) {
        return (100 * data[1]).toFixed(1) + "%";
      };
    }

    if (usesDollars) {
      yaxisOverrides.tickFormatter = function(tick) {
        return "$" + (tick > 10 ? addCommas(tick) : tick.toFixed(2));
      };

      tooltipValueFormatter = function(data) {
        return "$" + addCommas(data[1].toFixed(2));
      };
    }

    if (hasPoints) {
      pointsOverrides = {
        show : true,
        radius : 3
      };
    }

    // Special cases
    switch ($th.parents(".subsection").attr("id")) {
      case "app-stats/ios-installs" :
        xaxisOverrides.labelWidth = 10;
        xaxisOverrides.labelHeight = 10;
        gridOverrides.margin = {
          bottom : 10
        };
        tooltipLabelFormatter = function(data) {
          return "v"+data[0];
        };
        break;

      case "app-stats/daily-web-traffic" :
        tooltipLabelFormatter = function(data) {
          var date = new XDate(data[0], true).toString("MMM d, yyyy");
          if (!!data[2]) {
            return date + " (" + data[2] + ")";
          } else {
            return date;
          }
        }
        break;

      default :
        break;
    }

    $plot.plot(formattedData, {
      series : {
          stack : isStacked,
          bars : $.extend(true, {
              show : type === "bars",
              fill : 1,
              lineWidth : 0
            }, barsOverrides),
          lines : $.extend(true, {
              show : type === "lines",
              fill : isFilled ? 1 : 0
            }, linesOverrides),
          points : pointsOverrides,
          pie : {
              show : type === "pie",
              radius : 1,
              shadow : {
                  alpha : 0
                },
              stroke : {
                  width : 0
                },
              offset : {
                  left : -35
                },
              label : {
                  show: true,
                  radius: 2 / 3,
                  formatter: function (label, series) {
                      return '<div style="font-size:12px;text-align:center;padding:2px;color:#fff;"><strong>' + label + '</strong><br/>' + series.percent.toFixed(1) + '% ('+ series.data[0][1] + ')</div>';
                    }
                },
              highlight : {
                  opacity : 0
                }
            },
          shadowSize : 0
        },
      xaxis : $.extend(true, {
          tickLength : 0,
          font : {
              color : "#000"
            }
        }, xaxisOverrides),
      yaxis : $.extend(true, {
          tickColor : "#ccc",
          font : {
              color : "#000"
            }
        }, yaxisOverrides),
      grid : $.extend(true, {
          margin : {
              top : 0,
              right : 0,
              bottom : 0,
              left : 5
            },
          labelMargin : 10,
          axisMargin : 0,
          borderWidth : {
              top : 0,
              right : 0,
              bottom : 1,
              left : 0
            },
          borderColor : "#000",
          hoverable : true
        }, gridOverrides),
      legend : {
          show : numSeries > 1,
          noColumns : Math.min(numSeries,4),
          container : $legend
        },
      colors : [
          "#e57300",
          "#e4c951",
          "#899ab3",
          "#7f739f",
          "#84bcbb",
          "#a0a983",
          "#b1796b",
          "#e09f66"
        ]
    });

    if (type !== "pie") {
      $plot.on("plothover", function(e, pos, item) {
        var plotOffset,
            barPixelWidth = 0,
            tipWd,
            tipHt;

        if (!item) {
          tooltipItemSeriesIndex = undefined;
          tooltipItemDataIndex = undefined;

          $tooltip.removeClass("visible").css({
            top : 0,
            left : 0
          });
        } else if (tooltipItemSeriesIndex !== item.seriesIndex || tooltipItemDataIndex !== item.dataIndex) {
          tooltipItemSeriesIndex = item.seriesIndex;
          tooltipItemDataIndex = item.dataIndex;

          $tooltip.find(".graph-tooltip-series").html(item.series.label).toggleClass("hidden", numSeries === 1);
          $tooltip.find(".graph-tooltip-label").html(tooltipLabelFormatter(item.series.data[item.dataIndex]));
          $tooltip.find(".graph-tooltip-value").html(tooltipValueFormatter(item.series.data[item.dataIndex]));

          plotOffset = $plot.offset();

          if (type === "bars") {
            barPixelWidth = Math.ceil(item.series.bars.barWidth * item.series.xaxis.scale) + 1;
          }

          tipWd = $tooltip.outerWidth();
          tipHt = $tooltip.outerHeight();

          $tooltip.css({
            top : item.pageY - plotOffset.top - tipHt,
            left : item.pageX - plotOffset.left - (tipWd / 2) + (barPixelWidth / 2)
          }).addClass("visible");
        }
      });
    }

    if (numSeries === 1) {
      $legend.addClass("hidden");
    }
  });
});

function formatForFlot(inputData, seriesNames, precision) {
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
      REGEX_DATE = /Date\((\d{4}),(\d{1,2}),(\d{1,2})\)/,
      dataPoints = _(inputData).pluck("c"),
      seriesData = [],
      outputData;

  // Set up output series
  _.times(seriesNames.length, function() {
    seriesData.push([]);
  });


  _(dataPoints).each(function(dataPoint) {
    var key = _(dataPoint).first()["v"],
        values = _(dataPoint).chain().rest().pluck("v").value(),
        datePieces;

    // Parse the key
    if (!_(key).isNumber()) {
      datePieces = key.match(REGEX_DATE);

      if (datePieces !== null) {
        key = Date.UTC(datePieces[1], datePieces[2], datePieces[3]);
      } else {
        datePieces = key.split("-");

        if (datePieces.length === 2) {
          key = Date.UTC(2000 + parseInt(datePieces[1]), _(MONTHS).indexOf(datePieces[0]));
        }
      }
    }

    // Make a data pair for each value
    _(values).each(function(value, index) {
      if (!!precision) {
        value = parseFloat(value.toFixed(+precision));
      } else {
        value = Math.round(value);
      }
      seriesData[index].push([key, value]);
    });
  });

  // Map seriesData to seriesNames
  outputData = _(seriesNames).object(seriesData);

  return JSON.stringify(outputData).replace(/00000,/g, 'e5,');
}

