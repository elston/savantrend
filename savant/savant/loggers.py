import logging


class MyDbLogHandler(logging.Handler):
    def __init__(self):
        logging.Handler.__init__(self)

    def emit(self, record):
        from web.models import Logging

        obj = Logging()
        try:
            obj.http_code = str(getattr(record, 'status_code', '-'))
            obj.level = str(getattr(record, 'levelname', '-'))
            obj.logger_name = str(getattr(record, 'name', '-'))
            obj.module = str(getattr(record, 'module', '-'))
            obj.thread = str(getattr(record, 'thread', '-'))
            obj.thread_name = str(getattr(record, 'threadName', '-'))
            obj.exc_info = str(getattr(record, 'exc_info', '-'))
            obj.stack_info = str(getattr(record, 'stack_info', '-'))
            obj.message = str(getattr(record, 'message', '-'))
            obj.save()
        except:
            if True:
                print("Error!", obj.message, obj.exc_info, obj.stack_info)
