/*
 MachineSettings.js - ESP3D WebUI Target file

 Copyright (c) 2020 Luc Lebosse. All rights reserved.

 This code is free software; you can redistribute it and/or
 modify it under the terms of the GNU Lesser General Public
 License as published by the Free Software Foundation; either
 version 2.1 of the License, or (at your option) any later version.

 This code is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 Lesser General Public License for more details.

 You should have received a copy of the GNU Lesser General Public
 License along with This code; if not, write to the Free Software
 Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
*/
import { Fragment, h } from "preact";
import { useEffect, useState } from "preact/hooks";
import { T } from "../../../components/Translations";
import { processor } from "./processor";
import { useHttpFn } from "../../../hooks";
import { useUiContext, useUiContextFn } from "../../../contexts";
import { Target } from "./index";
import {
  espHttpURL,
  disableUI,
  formatFileSizeToString,
} from "../../../components/Helpers";
import {
  Loading,
  ButtonImg,
  CenterLeft,
  Progress,
} from "../../../components/Controls";
import { RefreshCcw, XCircle, Send } from "preact-feather";
import { CMD } from "./CMD-source";

const machineSetting = {};
machineSetting.cache = [];

const MachineSettings = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState(machineSetting.cache);
  const [collected, setCollected] = useState("0 B");
  const { createNewRequest, abortRequest } = useHttpFn;
  const { modals, toasts, uisettings } = useUiContext();
  const id = "Machine Tab";
  const sendSerialCmd = (cmd) => {
    createNewRequest(
      espHttpURL("command", cmd).toString(),
      { method: "GET", echo: cmd.cmd },
      {
        onSuccess: (result) => {
          //Result is handled on ws so just do nothing
        },
        onFail: (error) => {
          console.log("Error:", error);
          setIsLoading(false);
          toasts.addToast({ content: error, type: "error" });
          processor.stopCatchResponse();
        },
      }
    );
  };

  const processCallBack = (data, total) => {
    setCollected(formatFileSizeToString(total));
  };

  const processFeedback = (feedback) => {
    if (feedback.status) {
      if (feedback.command == "eeprom") {
        machineSetting.cache = CMD.command("formatEeprom", feedback.content);
      }
      if (feedback.status == "error") {
        console.log("got error");
        toasts.addToast({
          content: T("S4"),
          type: "error",
        });
      }
    }
    setIsLoading(false);
  };

  const onCancel = (e) => {
    toasts.addToast({
      content: T("S175"),
      type: "error",
    });
    processor.stopCatchResponse();
    machineSetting.cache = [];
    setIsLoading(false);
  };

  const onRefresh = (e) => {
    //get command
    const response = CMD.command("eeprom");
    //send query
    if (
      processor.startCatchResponse(
        "CMD",
        "eeprom",
        processFeedback,
        null,
        processCallBack
      )
    ) {
      setCollected("O B");
      setIsLoading(true);
      sendSerialCmd({ cmd: response.cmd });
    }
  };

  const generateValidation = (fieldData) => {
    const validation = {
      message: <Flag size="1rem" />,
      valid: true,
      modified: true,
    };
  };
  useEffect(() => {
    if (uisettings.getValue("autoload") && machineSetting.cache == "") {
      //load settings
      onRefresh();
    }
  }, []);

  return (
    <div class="container">
      <h4 class="show-low title">{Target}</h4>
      <div class="m-2" />
      <center>
        {isLoading && (
          <Fragment>
            <Loading class="m-2" />
            <div>{collected}</div>
            <ButtonImg
              donotdisable
              icon={<XCircle />}
              label={T("S28")}
              tooltip
              data-tooltip={T("S28")}
              onClick={onCancel}
            />
          </Fragment>
        )}
        {!isLoading && (
          <center class="m-2">
            {machineSetting.cache.length > 0 && (
              <div>
                <CenterLeft bordered>
                  {machineSetting.cache.map((element) => {
                    if (element.type == "comment")
                      return <div class="comment m-1  ">{element.data}</div>;
                    return (
                      <div class="input-group m-1">
                        <input
                          type="text"
                          class="form-input"
                          value={element.data}
                        />
                        <ButtonImg
                          group
                          icon={<Send />}
                          label={T("S81")}
                          tooltip
                          data-tooltip={T("S82")}
                        />
                      </div>
                    );
                  })}
                </CenterLeft>
              </div>
            )}

            <ButtonImg
              icon={<RefreshCcw />}
              label={T("S50")}
              tooltip
              data-tooltip={T("S23")}
              onClick={onRefresh}
            />
          </center>
        )}
      </center>
    </div>
  );
};

export { MachineSettings };
